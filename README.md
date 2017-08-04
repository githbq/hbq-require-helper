# 引用包辅助工具

## 方便引用库 可以按目录引用

## 安装  

```
yarn add require-helper
```

## 使用

```
// in ts
import * as requireHelper from 'require-helper'
// in js 
import requireHelper from 'require-helper'
   //or
const requireHelper=require('require-helper')

```
## 说明
- `cwd` 程序运行时所在根目录
- 如果方法的参数名是 paths ，可以是一个 字符串 ,或者一个字符串数组

### 属性

#### require

    `require(paths)`
> 引用一个文件
- 如果参数是一个字符串，则直接引用 
- 如果参数是一个数组，会自动 `path.join`

#### requireRoot

    `requireRoot(paths)`
> 从 `cwd` 作为起初目录，引入文件
 

#### requireDir

    `requireDir(paths, cb, filterCb)`
> 引用一个目录
源码
```javascript
/**
     * 
     * @param {路径,一个字符串,或者一个字符串数组,会自动join拼接} paths 
     * @param {如果定义并且返回false,会跳过本次结果,如果定义并返回新结果,则用新结果} cb 
     * 返回路径文件结果的数组   [{result,name}]
     */
    requireDir(paths, cb, filterCb) {
        let resultData = [];
        //路径过滤
        this.requireRuled(paths, (result, name) => {
            const newResult = cb && cb(result, name);
            if (cb && newResult) {
                resultData.push({ result: newResult, name });
            } else if (cb && newResult === false) {
                //定义了回调,但返回了false 则跳过本轮
            } else {
                resultData.push({ result, name });
            }
        }, filterCb || this.nameRule);
        return resultData;
    },
```

#### requireDirKV 

`requireDirKV(paths, cb)`
> 返回路径文件结果的对象   {[name]:result}]
```javascript
 //返回路径文件结果的对象   {[name]:result}]
    requireDirKV(paths, cb) {
        let resultData = {};
        //路径过滤
        this.requireRuled(paths, (result, name) => {
            resultData[name] = result;
            cb && cb(result, name);
        });
        return resultData;
    },
```

#### requireRecurse

`requireRecurse(path, filter, cb, filterCb)`
> 递归查找文件
 ```javascript
  //递归查找文件
    requireRecurse(path, filter, cb, filterCb) {
        let dirInfos = ioHelper.findRecurseSync(path, filter);
        let dirData = { arr: [], kv: {} };
        dirInfos.forEach((n) => {
            // if (n.isFile) {  //注释后 文件夹也要了
            //取得文件的相对路径名称且含文件名    xxx\\yyy.js=> xxx
            let dirname = pathTool.dirname(n.relative);
            let extName = pathTool.extname(n.relative);
            //取得 yyy
            let name = pathTool.basename(n.relative, extName);
            let fullname = ioHelper.replaceSep(pathTool.join(dirname, name)); //  相对路径  aaa/xxx/yyy.js=>  aaa/xxx/yyy 
            if ((filterCb && filterCb(name, dirname, n)) || (!filterCb && this.nameRule(name))) {
                let result = this.require(n.filePath);
                cb && cb(fullname, result, n);
                dirData.arr.push({ result, filePath: n.filePath, fullname, name, dirInfo: n });
                dirData.kv[fullname] = result;
            }
            // }
        });
        return dirData;
    }
 ```