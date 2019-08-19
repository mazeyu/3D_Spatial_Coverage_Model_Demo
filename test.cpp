#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <emscripten/emscripten.h>
#include <vector>
using namespace std;

// 一旦WASM模块被加载，main()中的代码就会执行
int main(int argc, char ** argv) {
    printf("WebAssembly module loaded\n");
}

// 返回1-6之间的一随机数
double EMSCRIPTEN_KEEPALIVE add(double *x, int n) {
    vector<double> y;
//    srand ( time(NULL) );
    double res = 0;
    for (int i = 0; i < n; i++) {
        y.push_back(x[i]);
    }

    return y[0];
}
