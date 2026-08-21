use serde_json::Value;

/// Attempts to detect and unescape a string if it contains serialized JSON
pub fn try_unescape_json(text: &str) -> Option<Value> {
    let trimmed = text.trim();
    if (trimmed.starts_with('{') && trimmed.ends_with('}'))
        || (trimmed.starts_with('[') && trimmed.ends_with(']'))
    {
        if let Ok(val) = serde_json::from_str::<Value>(trimmed) {
            return Some(val);
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_try_unescape_valid_object() {
        let raw = r#"{"name":"Alice","age":30}"#;
        let res = try_unescape_json(raw);
        assert!(res.is_some());
        let val = res.unwrap();
        assert_eq!(val["name"], "Alice");
        assert_eq!(val["age"], 30);
    }

    #[test]
    fn test_try_unescape_valid_array() {
        let raw = r#"[1, 2, "three"]"#;
        let res = try_unescape_json(raw);
        assert!(res.is_some());
        assert_eq!(res.unwrap().as_array().unwrap().len(), 3);
    }

    #[test]
    fn test_try_unescape_plain_string() {
        assert!(try_unescape_json("hello world").is_none());
        assert!(try_unescape_json("{ invalid json").is_none());
    }
}
