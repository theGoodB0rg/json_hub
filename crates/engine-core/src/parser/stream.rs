use crate::error::{EngineError, Result};
use serde_json::Value;
use std::io::BufRead;

pub enum StreamMode {
    Array,
    Lines,
}

pub struct JsonStreamReader<R: BufRead> {
    reader: R,
    mode: StreamMode,
    finished: bool,
    line_buf: String,
}

impl<R: BufRead> JsonStreamReader<R> {
    pub fn new(mut reader: R) -> Result<Self> {
        let mut mode = StreamMode::Lines;
        loop {
            let available = reader.fill_buf()?;
            if available.is_empty() {
                return Ok(Self {
                    reader,
                    mode,
                    finished: true,
                    line_buf: String::new(),
                });
            }

            let mut whitespace_count = 0;
            let mut found = None;
            for &b in available {
                if !b.is_ascii_whitespace() {
                    found = Some(b);
                    break;
                }
                whitespace_count += 1;
            }

            reader.consume(whitespace_count);

            if let Some(c) = found {
                if c == b'[' {
                    reader.consume(1); // consume the opening '['
                    mode = StreamMode::Array;
                } else {
                    mode = StreamMode::Lines;
                }
                break;
            }
        }

        Ok(Self {
            reader,
            mode,
            finished: false,
            line_buf: String::new(),
        })
    }

    /// Read next JSON Value item from the stream
    pub fn next_value(&mut self) -> Result<Option<Value>> {
        if self.finished {
            return Ok(None);
        }

        match self.mode {
            StreamMode::Lines => self.next_line_value(),
            StreamMode::Array => self.next_array_value(),
        }
    }

    fn next_line_value(&mut self) -> Result<Option<Value>> {
        loop {
            self.line_buf.clear();
            let bytes_read = self.reader.read_line(&mut self.line_buf)?;
            if bytes_read == 0 {
                self.finished = true;
                return Ok(None);
            }

            let trimmed = self.line_buf.trim();
            if trimmed.is_empty() {
                continue;
            }

            match serde_json::from_str::<Value>(trimmed) {
                Ok(val) => return Ok(Some(val)),
                Err(e) => return Err(EngineError::Json(e)),
            }
        }
    }

    fn next_array_value(&mut self) -> Result<Option<Value>> {
        // Skip leading whitespace and commas
        self.skip_array_delimiters()?;
        if self.finished {
            return Ok(None);
        }

        // Check if next char is closing bracket ']'
        {
            let buf = self.reader.fill_buf()?;
            if buf.is_empty() {
                self.finished = true;
                return Ok(None);
            }
            if buf[0] == b']' {
                self.reader.consume(1);
                self.finished = true;
                return Ok(None);
            }
        }

        // Read a single balanced JSON object or primitive
        let mut value_str = String::new();
        let mut depth_curly: i32 = 0;
        let mut depth_square: i32 = 0;
        let mut in_string = false;
        let mut escape_next = false;
        let mut started = false;

        loop {
            let (consumed, done) = {
                let buf = self.reader.fill_buf()?;
                if buf.is_empty() {
                    self.finished = true;
                    break;
                }

                let mut advance = 0;
                let mut finished_item = false;

                for &b in buf {
                    advance += 1;
                    let c = b as char;
                    value_str.push(c);

                    if escape_next {
                        escape_next = false;
                        continue;
                    }

                    if c == '\\' && in_string {
                        escape_next = true;
                        continue;
                    }

                    if c == '"' {
                        in_string = !in_string;
                        started = true;
                        continue;
                    }

                    if in_string {
                        continue;
                    }

                    match c {
                        '{' => {
                            depth_curly += 1;
                            started = true;
                        }
                        '}' => {
                            depth_curly -= 1;
                            if started && depth_curly == 0 && depth_square == 0 {
                                finished_item = true;
                                break;
                            }
                        }
                        '[' => {
                            depth_square += 1;
                            started = true;
                        }
                        ']' => {
                            if depth_square > 0 {
                                depth_square -= 1;
                                if started && depth_curly == 0 && depth_square == 0 {
                                    finished_item = true;
                                    break;
                                }
                            } else {
                                // End of outer array
                                value_str.pop(); // Remove the outer ']'
                                self.finished = true;
                                finished_item = true;
                                break;
                            }
                        }
                        ',' if started && depth_curly == 0 && depth_square == 0 => {
                            value_str.pop(); // Remove trailing comma
                            finished_item = true;
                            break;
                        }
                        _ if !c.is_ascii_whitespace() => {
                            started = true;
                        }
                        _ => {}
                    }
                }

                (advance, finished_item)
            };

            self.reader.consume(consumed);
            if done {
                break;
            }
        }

        let trimmed = value_str.trim();
        if trimmed.is_empty() {
            return Ok(None);
        }

        match serde_json::from_str::<Value>(trimmed) {
            Ok(val) => Ok(Some(val)),
            Err(e) => Err(EngineError::Json(e)),
        }
    }

    fn skip_array_delimiters(&mut self) -> Result<()> {
        loop {
            let buf = self.reader.fill_buf()?;
            if buf.is_empty() {
                self.finished = true;
                return Ok(());
            }

            let mut advance = 0;
            let mut stop = false;
            for &b in buf {
                if b.is_ascii_whitespace() || b == b',' {
                    advance += 1;
                } else {
                    stop = true;
                    break;
                }
            }

            self.reader.consume(advance);
            if stop || advance == 0 {
                break;
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    #[test]
    fn test_stream_array_of_objects() {
        let json_data = r#"[
            {"id": 1, "name": "Item 1"},
            {"id": 2, "name": "Item 2"},
            {"id": 3, "name": "Item 3"}
        ]"#;

        let cursor = Cursor::new(json_data.as_bytes());
        let mut reader = JsonStreamReader::new(cursor).unwrap();

        let mut items = Vec::new();
        while let Some(val) = reader.next_value().unwrap() {
            items.push(val);
        }

        assert_eq!(items.len(), 3);
        assert_eq!(items[0]["id"], 1);
        assert_eq!(items[1]["name"], "Item 2");
        assert_eq!(items[2]["id"], 3);
    }

    #[test]
    fn test_stream_ndjson() {
        let ndjson = "{\"id\": 10}\n{\"id\": 20}\n{\"id\": 30}\n";
        let cursor = Cursor::new(ndjson.as_bytes());
        let mut reader = JsonStreamReader::new(cursor).unwrap();

        let mut items = Vec::new();
        while let Some(val) = reader.next_value().unwrap() {
            items.push(val);
        }

        assert_eq!(items.len(), 3);
        assert_eq!(items[0]["id"], 10);
        assert_eq!(items[1]["id"], 20);
        assert_eq!(items[2]["id"], 30);
    }
}
