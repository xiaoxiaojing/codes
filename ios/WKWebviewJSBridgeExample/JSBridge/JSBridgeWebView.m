//
//  bridge.m
//  jsBridge-test
//
//  Created by 唐彩儿 on 2022/4/6.
//

#import "BridgeWebView.h"

@implementation BridgeWebView

- (NSString *)name {
    return @"CustomHandler";
}

- (instancetype)initWithFrame:(CGRect)frame configuration:(WKWebViewConfiguration *)configuration
{
    configuration.userContentController = [[WKUserContentController alloc] init];
    NSString* bridgeString = [self getUserScript];
    
    WKUserScript *script = [[WKUserScript alloc] initWithSource:bridgeString injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:true];
    
    [configuration.userContentController addUserScript:script];
    [configuration.userContentController addScriptMessageHandler:self name:[self name]];
    
    self = [super initWithFrame:frame configuration:configuration];
    
    
    return self;
}

- (NSString *)getUserScript {
    NSString *bridgePath = [[NSBundle mainBundle] pathForResource:@"bridge" ofType:@"js"];
    NSString *bridgeString = [NSString stringWithContentsOfFile:bridgePath encoding:NSUTF8StringEncoding error:nil];
    return bridgeString;
}

#pragma mark -- WKScriptMessageHandler
- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message {
    
    if ([message.name isEqualToString:[self name]]) {
        NSLog(@"\nbody:\n%@", message.body);
        NSString *id = [message.body objectForKey:@"id"];

        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:message.body options:0 error:0];
        NSString *resultStr = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
        NSString *script = [NSString stringWithFormat:@"%@.%@(\"%@\",%@)", @"window.bridge", @"onCall", id, resultStr];

        [self evaluateJavaScript:script completionHandler:nil];
    }
}
@end
