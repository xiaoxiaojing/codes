//
//  bridge.h
//  jsBridge-test
//
//  Created by 唐彩儿 on 2022/4/6.
//

#import <WebKit/WebKit.h>

@interface BridgeWebView: WKWebView<WKScriptMessageHandler>

@end
