module.exports = {
    "extends": "eslint:recommended",
    "env": {
        "browser": true,
        "es6": true,
        "worker": true
    },
    "rules": {
        "space-before-blocks": "warn",
        "keyword-spacing": ["warn", {"before": true, "after": true}],
        "comma-spacing": ["warn", { "before": false, "after": true }],
        "spaced-comment": "warn",
        "indent": ["error", 2],
        "max-len": ["warn", 80],
        "no-unused-vars": ["warn", {"vars": "local"}]
    }
};
