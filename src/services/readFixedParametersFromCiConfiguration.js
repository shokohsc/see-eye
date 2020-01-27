'use strict';

async function readFixedParametersFromCiConfiguration(ciConfiguration) {

    try {
        let fixed = [];
        let fixedConf = [];
        if (ciConfiguration['build-args'] && ciConfiguration['build-args'].fixed) {
            fixedConf = ciConfiguration['build-args'].fixed;
        } else {
            return fixed;
        }

        let index = 0;
        fixedConf.forEach((parameter) => {
            fixed[index] = [];
            parameter.values.forEach((value) => {
                fixed[index].push({
                    'key': parameter.key,
                    'value': value,
                    'tagKey': parameter.tag_key,
                });
            });
            index++;
        });

        return fixed;
    } catch (err) {
        throw err;
    }

};

module.exports = readFixedParametersFromCiConfiguration;
