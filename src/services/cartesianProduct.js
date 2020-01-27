'use strict';

async function cartesianProduct(arrays) {

    let r = [],
        max = arrays.length-1;

    function helper(arr, i) {
        for (let j=0, l=arrays[i].length; j<l; j++) {
            let a = arr.slice(0); // clone arr
            a.push(arrays[i][j]);
            if (i==max)
                r.push(a);
            else
                helper(a, i+1);
        }
    }
    helper([], 0);
    return r;
};

module.exports = cartesianProduct;
