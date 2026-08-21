use super::unescape::try_unescape_json;
use crate::options::{ArrayHandling, ConversionOptions};
use serde_json::Value;

pub type FlatRow = Vec<(String, String)>;

/// Flattens a single JSON Value into a flat key-value list of pairs
pub fn flatten_value(value: &Value, options: &ConversionOptions) -> FlatRow {
    let mut row = Vec::new();
    flatten_recursive(value, "", 0, options, &mut row);
    row
}

fn flatten_recursive(
    value: &Value,
    prefix: &str,
    depth: usize,
    options: &ConversionOptions,
    out: &mut FlatRow,
) {
    if depth > options.max_depth {
        out.push((prefix.to_string(), value.to_string()));
        return;
    }

    match value {
        Value::Object(map) => {
            if map.is_empty() {
                if !prefix.is_empty() {
                    out.push((prefix.to_string(), "{}".to_string()));
                }
                return;
            }
            for (key, val) in map {
                let new_key = if prefix.is_empty() {
                    key.clone()
                } else {
                    format!("{}{}{}", prefix, options.key_separator, key)
                };
                flatten_recursive(val, &new_key, depth + 1, options, out);
            }
        }
        Value::Array(arr) => {
            if arr.is_empty() {
                if !prefix.is_empty() {
                    out.push((prefix.to_string(), "[]".to_string()));
                }
                return;
            }

            let has_objects = arr.iter().any(|v| v.is_object() || v.is_array());

            if has_objects || options.array_handling == ArrayHandling::Expand {
                for (idx, val) in arr.iter().enumerate() {
                    let new_key = if prefix.is_empty() {
                        idx.to_string()
                    } else {
                        format!("{}{}{}", prefix, options.key_separator, idx)
                    };
                    flatten_recursive(val, &new_key, depth + 1, options, out);
                }
            } else if options.array_handling == ArrayHandling::Stringify {
                let s = serde_json::to_string(arr).unwrap_or_else(|_| "[]".to_string());
                out.push((prefix.to_string(), s));
            } else {
                // ArrayHandling::Join
                let items: Vec<String> = arr
                    .iter()
                    .map(|v| match v {
                        Value::String(s) => s.clone(),
                        _ => v.to_string(),
                    })
                    .collect();
                out.push((prefix.to_string(), items.join(", ")));
            }
        }
        Value::String(s) => {
            if options.auto_unescape {
                if let Some(unescaped) = try_unescape_json(s) {
                    flatten_recursive(&unescaped, prefix, depth + 1, options, out);
                    return;
                }
            }
            out.push((prefix.to_string(), s.clone()));
        }
        Value::Number(n) => {
            out.push((prefix.to_string(), n.to_string()));
        }
        Value::Bool(b) => {
            out.push((prefix.to_string(), b.to_string()));
        }
        Value::Null => {
            out.push((prefix.to_string(), "".to_string()));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_flatten_simple_object() {
        let val = json!({
            "id": 101,
            "name": "Alice",
            "active": true
        });
        let opts = ConversionOptions::default();
        let flat = flatten_value(&val, &opts);

        assert_eq!(flat.len(), 3);
        assert_eq!(flat[0], ("id".to_string(), "101".to_string()));
        assert_eq!(flat[1], ("name".to_string(), "Alice".to_string()));
        assert_eq!(flat[2], ("active".to_string(), "true".to_string()));
    }

    #[test]
    fn test_flatten_nested_object() {
        let val = json!({
            "user": {
                "profile": {
                    "username": "alice99"
                }
            }
        });
        let opts = ConversionOptions::default();
        let flat = flatten_value(&val, &opts);

        assert_eq!(flat.len(), 1);
        assert_eq!(flat[0], ("user.profile.username".to_string(), "alice99".to_string()));
    }

    #[test]
    fn test_flatten_with_auto_unescape() {
        let val = json!({
            "order_id": 456,
            "payload": "{\"sku\":\"PROD-1\",\"qty\":5}"
        });
        let opts = ConversionOptions {
            auto_unescape: true,
            ..Default::default()
        };
        let flat = flatten_value(&val, &opts);

        assert_eq!(flat.len(), 3);
        assert_eq!(flat[0], ("order_id".to_string(), "456".to_string()));
        assert_eq!(flat[1], ("payload.sku".to_string(), "PROD-1".to_string()));
        assert_eq!(flat[2], ("payload.qty".to_string(), "5".to_string()));
    }

    #[test]
    fn test_flatten_array_join_and_expand() {
        let val = json!({
            "tags": ["rust", "fast", "cli"]
        });

        // Test Join
        let opts_join = ConversionOptions {
            array_handling: ArrayHandling::Join,
            ..Default::default()
        };
        let flat_join = flatten_value(&val, &opts_join);
        assert_eq!(flat_join[0], ("tags".to_string(), "rust, fast, cli".to_string()));

        // Test Expand
        let opts_expand = ConversionOptions {
            array_handling: ArrayHandling::Expand,
            ..Default::default()
        };
        let flat_expand = flatten_value(&val, &opts_expand);
        assert_eq!(flat_expand.len(), 3);
        assert_eq!(flat_expand[0], ("tags.0".to_string(), "rust".to_string()));
        assert_eq!(flat_expand[1], ("tags.1".to_string(), "fast".to_string()));
        assert_eq!(flat_expand[2], ("tags.2".to_string(), "cli".to_string()));
    }
}
