/**
 * @date 2022-03-29
 * @author tj
 * @description 任务调度器
 */
import { ArrayQueue } from "./ArrayQueue";

class TaskError extends Error {
  constructor(message: string) {
    super(message);
  }
}
enum ITASKSTATE {
  QUEUED = 0,
  PROCESSING = 1,
  DONE = 2,
}
interface ITaskCallback<R> {
  (err?: TaskError, result?: R): void;
}
/**
 * 任务的三个要素：
 * 1、任务标识：key
 * 2、携带的数据：payload
 * 3、任务执行完成后的回调：callback
 */
class TaskEntity<T, R> {
  callback: ITaskCallback<R>;
  key: string;
  payload: T;

  state = ITASKSTATE.QUEUED; // 执行状态
  result: R; // 执行结果
  error: TaskError; // 错误记录
  callbacks: ITaskCallback<R>[] = [];

  constructor(key: string, data: T, callback: ITaskCallback<R>) {
    this.key = key;
    this.payload = data;
    this.callback = callback;
  }
}

interface IProcessor<T, R> {
  (item: T, callback: ITaskCallback<R>): void;
}
/**
 * 任务队列的特征
 * 1、任务自动执行
 * 2、支持并发控制
 * 3、有一个处理任务的函数
 */
interface ITaskQueueProps<T, R> {
  // 队列名称
  name: string;
  parent?: TaskQueue<any, any>;
  // 并发数
  parallelism?: number;
  // 任务处理函数
  processor?: IProcessor<T, R>;
}

// 堆栈最大值：用于防止堆栈过多，影响任务的callback执行
const MAX_STACK_NUM = 3;
let currentStackNum = 0; // 当前堆栈，由全部的TaskQueue实例共享

export class TaskQueue<T, R> {
  private _name: string;
  private _parallelism: number;
  private _processor: IProcessor<T, R>;
  private _parent: TaskQueue<any, any>;

  private _queue: ArrayQueue<TaskEntity<T, R>>; // 任务队列
  private _tasks = new Map();
  private _stopped = false; // 任务执行是否已终止
  private _root: TaskQueue<T, R> = this;
  private _children: TaskQueue<any, any>[] = [];

  // _activeTasks、_isScheduling、_needProcessing由所有任务（父任务、子任务）共享
  // 正在执行的任务数
  private _activeTasks = 0;
  // 防止重复调用setImmediate
  private _isScheduling = false;
  // 判断是否需要处理任务：当前队列为空（其子任务的队列也为空），不需要继续处理任务
  private _needProcessing = false;

  constructor(props: ITaskQueueProps<T, R>) {
    this._name = props.name;
    this._queue = new ArrayQueue();
    this._parallelism = props.parallelism || 1;
    this._processor = props.processor;

    // 父任务
    this._parent = props.parent;
    if (this._parent) {
      this._parent._children.push(this);
      this._root = this._parent;
    }
  }

  // 添加任务
  add(key: string, payload: T, callback: ITaskCallback<R>) {
    if (this._stopped) {
      return callback(new TaskError(`${this._name} task queue was stopped`));
    }
    const task = this._tasks.get(key);
    /**
     * 处理重复task（即：key一样）
     * 1、task已完成：直接使用结果
     * 2、task未完成：将当前callback存入上一个task的callbacks中
     */
    if (task !== undefined) {
      if (task.state === ITASKSTATE.DONE) {
        // 防止嵌套调用时，堆栈过深
        if (++currentStackNum > MAX_STACK_NUM) {
          process.nextTick(() => {
            callback(task.error, task.result);
          });
        } else {
          callback(task.error, task.result);
        }
        currentStackNum--;
      } else {
        task.callbacks.push(callback);
      }
      return;
    }

    // 添加新任务
    const newTask = new TaskEntity(key, payload, callback);
    if (this._stopped) {
      this._root._activeTasks++;
      process.nextTick(() => {
        this._handleTaskResult(
          newTask,
          new TaskError(`${this._name} task queue was stopped`),
          null
        );
      });
    } else {
      this._tasks.set(key, newTask);
      this._queue.enqueue(newTask);

      // 任务调度
      const root = this._root;
      root._needProcessing = true;
      if (root._isScheduling === false) {
        root._isScheduling = true;
        setImmediate(root._schedule);
      }
    }
  }
  /**
   * 增加并发数
   */
  increaseParallelism() {
    const root = this._root;
    root._parallelism++;
    if (!root._isScheduling && root._needProcessing) {
      root._isScheduling = true;
      setImmediate(root._schedule);
    }
  }
  /**
   * 减少并发数
   */
  decreaseParallelism() {
    const root = this._root;
    root._parallelism--;
  }

  stop() {
    this._stopped = true;
    const queue = this._queue;
    // 清空队列
    this._queue = new ArrayQueue();
    const root = this._root;
    // 执行队列中的任务
    for (const taskEntity of queue) {
      this._tasks.delete(taskEntity.key);
      root._activeTasks++;
      this._handleTaskResult(
        taskEntity,
        new TaskError(`${this._name} task queue was stopped`),
        null
      );
    }
  }

  private _schedule = () => {
    // 未达到并发数时，就可以一直执行任务
    while (this._activeTasks < this._parallelism) {
      const task = this._queue.dequeue();
      if (task === undefined) break;
      this._activeTasks++;
      task.state = ITASKSTATE.PROCESSING;
      this._processTask(task);
    }
    this._isScheduling = false;
    if (this._queue.length > 0) return;

    // 如果有子任务，继续处理子任务
    if (this._children.length > 0) {
      for (const child of this._children) {
        while (this._activeTasks < this._parallelism) {
          const task = child._queue.dequeue();
          if (task === undefined) break;
          this._activeTasks++;
          task.state = ITASKSTATE.PROCESSING;
          child._processTask(task);
        }
        if (child._queue.length > 0) return;
      }
    }

    // 队列中没有任务时，则表示不需要继续进行任务调度
    if (!this._isScheduling) {
      this._needProcessing = false;
    }
  };

  private _processTask(task: TaskEntity<T, R>) {
    let inCallback = false;
    try {
      this._processor(task.payload, (e, r) => {
        inCallback = true;
        this._handleTaskResult(task, e, r);
      });
    } catch (err) {
      if (inCallback) throw err;
      this._handleTaskResult(task, err, null);
    }
  }

  /**
   * 处理Task处理结果并重启schedule
   * @param task 当前任务
   * @param err 任务执行错误信息
   * @param result 任务执行结果
   */
  private _handleTaskResult(task: TaskEntity<T, R>, err: TaskError, result: R) {
    const taskCallback = task.callback;
    const taskCallbacks = task.callbacks;

    task.state = ITASKSTATE.DONE;
    task.result = result;
    task.error = err;
    task.callback = undefined;
    task.callbacks = undefined;

    const root = this._root;
    root._activeTasks--;
    if (root._isScheduling === false && root._needProcessing === true) {
      root._isScheduling = true;
      setImmediate(root._schedule);
    }

    if (currentStackNum++ > MAX_STACK_NUM) {
      process.nextTick(() => {
        taskCallback(err, result);
        if (taskCallbacks !== undefined) {
          for (const callback of taskCallbacks) {
            callback(err, result);
          }
        }
      });
    } else {
      taskCallback(err, result);
      if (taskCallbacks !== undefined) {
        for (const callback of taskCallbacks) {
          callback(err, result);
        }
      }
    }
    currentStackNum--;
  }
}
