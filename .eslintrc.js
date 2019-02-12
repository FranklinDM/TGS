module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2015
    },
    "globals": {
        "gBundle": true,
        "gStrings": true,
        "Components": false,
        "Services": false,
        "AiOS": false,
        "AiOS_Objects": false,
        "AiOS_HELPER": false
    },
    "rules": {
        "indent": [
            "error",
            4
        ],
        "no-undef": "off",
        "no-unused-vars": "off",
        "no-sparse-arrays": "warn",
        "no-console": "warn",
        "linebreak-style": [
            "error",
            "windows"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};