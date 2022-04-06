//
//  ViewController.m
//  jsBridge-test
//
//  Created by 唐彩儿 on 2022/4/6.
//

#import "ViewController.h"
#import <WebKit/WebKit.h>

@interface ViewController ()<WKUIDelegate>
@property WKWebView *webView;

@end

@implementation ViewController
- (void)viewDidLoad {
    [super viewDidLoad];
    [self createNav];
    [self createWebView];
}

- (void)createNav {
    UIView *navView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, self.view.frame.size.width, 64)];
    [self.view addSubview:navView];
    
    navView.backgroundColor = [UIColor blueColor];
}

- (void)createWebView {
    // 创建webview
    WKWebViewConfiguration *config = [[WKWebViewConfiguration alloc] init];
    WKWebView *webView = [[WKWebView alloc] initWithFrame:CGRectMake(0, 64, self.view.frame.size.width, self.view.frame.size.height - 64) configuration:config];
    [self.view addSubview:webView];
    self.webView = webView;
    
    // 加载本地html文件
    NSString *path = [[NSBundle mainBundle] bundlePath];
    NSURL *baseURL = [NSURL fileURLWithPath:path];
    NSString *htmlPath = [[NSBundle mainBundle] pathForResource:@"index" ofType:@"html"];
    NSString *htmlString = [NSString stringWithContentsOfFile:htmlPath encoding:NSUTF8StringEncoding error:nil];
    [self.webView loadHTMLString:htmlString baseURL:baseURL];
}

@end
