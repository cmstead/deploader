'use strict';

const fs = require('fs');
const signet = require('signet')();
const isArray = signet.isTypeOf('array');

const optionsDef = {
    cwd: '?string',
    modulePaths: 'array<string>',
    extensions: '?array<string>',
};

signet.defineDuckType('deploaderOptions', optionsDef);

function statFile(cwd, path, filename) {
    try {
        fs.lstatSync([path, filename].join(path.sep));
        return true;
    } catch (e) {
        return false
    }
}

function hasExtensions (options) {
    return isArray(options.extensions) && options.extensions.length > 0;
}

const deploaderFactory = signet.enforce(
    'options:deploaderOptions => * => *',

    function deploaderFactory(options) {

        return signet.enforce(
            'dependencyName:string => *',

            function loadDependency(dependencyString) {
                let dependencyFiles = hasExtensions(options) ?
                    options.extensions.map(extension => dependencyString + extension) :
                    [dependencyString];
                
                let dependencyTuples = dependencyFiles.reduce(function (result, filename){
                    let moduleTuples = options.modulePaths.map(path => [options.cwd, path, filename]);
                    result.concat(moduleTuples);
                }, []);

                let matches = dependencyTuples.filter(tuple => statFile.apply(null, tuple));

                if(matches.length > 1) {
                    throw new Error('Unable to determine correct dependency, multiple matches were found');
                } else if(matches.length === 0) {
                    throw new Error('No dependency matches found in filesystem');
                } else {
                    return require(matches[0].join(path.sep));
                }
            }
        );


    },
    {
        inputError: function () {
            let message = 'options must be in the following form: \n';
            message += JSON.stringify(optionsDef, null, 4);
        }
    }
);


module.exports = deploaderFactory;