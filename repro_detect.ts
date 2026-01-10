
// Logic copied from flattener.ts
const ARRAY_SAMPLE_SIZE = 5;

type ArrayType = 'objects' | 'primitives' | 'nested' | 'mixed';

function detectArrayType(arr: any[]): ArrayType {
    if (arr.length === 0) return 'primitives';

    const sample = arr.slice(0, ARRAY_SAMPLE_SIZE);
    let hasObject = false;
    let hasPrimitive = false;
    let hasArray = false;

    for (const item of sample) {
        if (Array.isArray(item)) {
            hasArray = true;
        } else if (item !== null && typeof item === 'object') {
            hasObject = true;
        } else {
            hasPrimitive = true;
        }
    }

    // Nested arrays (like GeoJSON coordinates)
    if (hasArray) {
        return 'nested';
    }

    // Mixed content
    if ((hasObject && hasPrimitive) || (hasObject && hasArray) || (hasPrimitive && hasArray)) {
        return 'mixed';
    }

    // Arrays of objects (typical spreadsheet case)
    if (hasObject) {
        return 'objects';
    }

    // Arrays of primitives
    return 'primitives';
}

// Tests
console.log('["a", "b"]:', detectArrayType(["a", "b"]));
console.log('[1, 2]:', detectArrayType([1, 2]));
console.log('[{}, {}]:', detectArrayType([{}, {}]));
console.log('[null, "a"]:', detectArrayType([null, "a"]));
console.log('[new String("a")]:', detectArrayType([new String("a")]));
console.log('Mix:', detectArrayType(["a", {}]));
