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

        fixedConf.forEach((parameter) => {
            fixed.push({'key': parameter.key, 'value': parameter.value, 'tagKey': parameter.tag_key});
        });

        return fixed;
    } catch (err) {
        throw err;
    }

};

module.exports = readFixedParametersFromCiConfiguration;
