// Helper to automatically load the contents of the corresponding directory

// require-dir will filter out itself so do not worry about recursive call problems such as requireDir ('./')
const requireDir = require('require-dir'); 
const pathTool = require('path');
const ioHelper = require('io-helper').default;
const _ = require('lodash')
module.exports = {
    // ordinary require support array parameters
    require(paths) {
        paths = [].concat(paths);
        let pathValue = pathTool.join.apply(null, paths);
        const result = require(pathValue);
        if (result) {
            return result.default ? result.default : result
        }
        return result
    },
    / **
     * Reference the template from the root node
     * @param {* path relative to the root of the program running} paths
     * /
    requireRoot(paths) {
        return this.require.call(null, [process.cwd()].concat(paths));
    },
     / **
     * Filter the path by rule require
     * @param {* path relative to the root of the program running} paths
     * /
    requireRuled(paths, cb, filterCb) {
        paths = [].concat(paths);
        let pathValue = pathTool.join.apply(null, paths);
        let dirData = requireDir(pathValue);
        // path filter
        _.each(dirData, (result, name) => {
            if ((filterCb && filterCb(name)) || (!filterCb && this.nameRule(name))) { 
                // non-entry JS and file names are underlined
                cb && cb(result && result.default ? result.default : result, name);
            }
        });
    },
    / **
     *
     * @param {path, a string, or a string array, will automatically join splicing} paths
     * @param {if defined and returns false, will skip this result, if the definition and return the new results, then use the new results} cb
     * Returns the array of path file results [{result, name}]
     * /
    requireDir(paths, cb, filterCb) {
        let resultData = [];
        // path filter
        this.requireRuled(paths, (result, name) => {
            const newResult = cb && cb(result, name);
            if (cb && newResult) {
                resultData.push({ result: newResult, name });
            } else if (cb && newResult === false) {
                // Defines the callback, but returns false to skip the current round
            } else {
                resultData.push({ result, name });
            }
        }, filterCb || this.nameRule);
        return resultData;
    },
    // Returns the object of the path file result {[name]: result}]
    requireDirKV(paths, cb) {
        let resultData = {};
        // path filter
        this.requireRuled(paths, (result, name) => {
            resultData[name] = result;
            cb && cb(result, name);
        });
        return resultData;
    },
    nameRule(name) {
        return !(/^(index|_)/.test(name));
    },
    // Recursively find the file
    requireRecurse(path, filter, cb, filterCb) {
        let dirInfos = ioHelper.findRecurseSync(path, filter);
        let dirData = { arr: [], kv: {} };
        dirInfos.forEach((n) => {
            // if (n.isFile) {// After the note has the folder
            // get the relative pathname of the file and include the file name xxx \\ yyy.js => xxx
            let dirname = pathTool.dirname(n.relative);
            let extName = pathTool.extname(n.relative);
             // get yyy
            let name = pathTool.basename(n.relative, extName);
            let fullname = ioHelper.replaceSep(pathTool.join(dirname, name)); // relative path aaa / xxx / yyy.js => aaa / xxx / yyy 
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
};
