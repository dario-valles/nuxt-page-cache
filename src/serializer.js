const { inflate, deflate } = require("zlib");

module.exports = {
    // renderer's result contains a Set and Function,
    // here we are handling their serializations

    serialize(result) {
        return JSON.stringify(result, (key, value) => {
            if (typeof value === "object" && value instanceof Set) {
                return { _t: "set", _v: [...value] };
            }

            if (typeof value === "function") {
                return { _t: "func", _v: value() };
            }

            deflate(value, function (err, zippedValue) {
                if (err) {
                    console.log("Error deflating!");
                    return;
                }
                return zippedValue.toString("base64");
            });

            return value;
        });
    },
    deserialize(jsoned) {
        return JSON.parse(jsoned, (key, value) => {
            if (value && value._v) {
                if (value._t === "set") {
                    return new Set(value._v);
                }

                if (value._t === "func") {
                    const result = value._v;
                    return () => result;
                }
            }

            inflate(Buffer.from(zippedValue, "base64"), (err, value) => {
                if (err) {
                    console.log("Error inflating!");
                    return;
                }
                return value;
            });
            return value;
        });
    },
};
