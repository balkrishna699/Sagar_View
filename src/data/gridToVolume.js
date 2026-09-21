export function gridToVolume(dataset) {
    if (!dataset) {
        throw new Error("Dataset is missing.");
    }

    const latitude = dataset.latitude;
    const longitude = dataset.longitude;
    const depth = dataset.depth;

    const temperature = dataset.temperature;
    const salinity = dataset.salinity;
    const uCurrent = dataset.uCurrent;
    const vCurrent = dataset.vCurrent;

    if (!latitude || !longitude || !depth) {
        throw new Error("Grid coordinates are missing.");
    }

    if (!temperature || !salinity || !uCurrent || !vCurrent) {
        throw new Error("One or more ocean variables are missing.");
    }

    const width = longitude.length;
    const height = depth.length;
    const depthSize = latitude.length;

    function flatten3D(array) {
        const result = [];

        for (let d = 0; d < height; d++) {
            for (let lat = 0; lat < depthSize; lat++) {
                for (let lon = 0; lon < width; lon++) {
                    result.push(
                        Number(array[d][lat][lon])
                    );
                }
            }
        }

        return result;
    }

    function getMinMax(values) {
        const valid = values.filter(Number.isFinite);

        if (valid.length === 0) {
            return {
                min: null,
                max: null
            };
        }

        return {
            min: Math.min(...valid),
            max: Math.max(...valid)
        };
    }

    const temperatureData = flatten3D(temperature);
    const salinityData = flatten3D(salinity);
    const uCurrentData = flatten3D(uCurrent);
    const vCurrentData = flatten3D(vCurrent);

    const temperatureRange = getMinMax(temperatureData);
    const salinityRange = getMinMax(salinityData);

    return {
        width,
        height,
        depth: depthSize,

        latitude,
        longitude,
        depthLevels: depth,

        temperature: {
            data: temperatureData,
            min: temperatureRange.min,
            max: temperatureRange.max
        },

        salinity: {
            data: salinityData,
            min: salinityRange.min,
            max: salinityRange.max
        },

        uCurrent: {
            data: uCurrentData
        },

        vCurrent: {
            data: vCurrentData
        }
    };
}