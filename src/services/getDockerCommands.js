'use strict';

async function getDockerCommands(products, repository, fixed) {

    let commands = [];
    products.forEach((product) => {
        let command = '';
        const buildTag = '-t '+repository.author+'/'+repository.repository+':';
        let buildTags = [];
        let buildArgs = {};
        product.forEach((arg) => {
            command += '--build-arg '+arg.key+'='+arg.value+' ';
            buildArgs[arg.key] = arg.value;
            if (arg.image)
                buildTags.push(arg.image+'-'+arg.value);
            if (arg.repository)
                buildTags.push(arg.repository+'-'+arg.value);
        });
        fixed.forEach((parameter) => {
            command += '--build-arg '+parameter.key+'='+parameter.value+' ';
            buildArgs[parameter.key] = parameter.value;
            buildTags.push(parameter.tagKey+'-'+parameter.value);
        });
        command += buildTag;
        command += buildTags.join('-');
        commands.push({
            'command': command,
            'args': buildArgs,
            'tag': repository.author+'/'+repository.repository+':'+buildTags.join('-'),
        });
    });

    return commands;
};

module.exports = getDockerCommands;
