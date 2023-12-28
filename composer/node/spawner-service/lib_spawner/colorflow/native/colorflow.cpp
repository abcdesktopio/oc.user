#include <iostream>
#include <node/node.h>
#include "include/colorflow.h"

extern char* strLastErrorMessage;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::String;
using v8::Local;
using v8::Object;
using v8::Value;

void GetAverageColor(const v8::FunctionCallbackInfo<v8::Value>& args){
    Isolate* isolate = args.GetIsolate();
    
    // Throws an error if no arguments are given
    if (args.Length() < 1) {
        isolate->ThrowException(v8::Exception::TypeError(
            String::NewFromUtf8(isolate, "Wrong number of arguments").ToLocalChecked()));
        return;
    }

    // Throws an error if non-string arguments are given
    if (!args[0]->IsString()) {
        isolate->ThrowException(v8::Exception::TypeError( 
            String::NewFromUtf8(isolate, "Argument must be a string").ToLocalChecked()));
        return;
    }

    String::Utf8Value utf8Value(isolate, args[0]);
    char* filename = *utf8Value;
    pixel myPixel;

    int out = getColor(filename, &myPixel);
    if(out){
      isolate->ThrowException(v8::Exception::TypeError( 
            String::NewFromUtf8(isolate, strLastErrorMessage).ToLocalChecked()));
        return;
    }
    

    char* result = pixelToHex( &myPixel );
    
    if(!result){
      isolate->ThrowException(v8::Exception::TypeError( 
            String::NewFromUtf8(isolate, strLastErrorMessage).ToLocalChecked()));
        return;
    }
    // Convert the C string result to a v8 string
    Local<v8::String> v8Result = String::NewFromUtf8(isolate, result).ToLocalChecked();

    args.GetReturnValue().Set(v8Result);
}

void Initialize(v8::Local<v8::Object> exports){
    NODE_SET_METHOD(exports, "getAverageColor", GetAverageColor);
}

NODE_MODULE(colorflow, Initialize);