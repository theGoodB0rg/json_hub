use crate::error::Result;
use crate::flattener::FlatRow;
use serde_json::{Map, Value};
use std::io::Write;

pub struct StreamingJsonlWriter<W: Write> {
    writer: W,
}

impl<W: Write> StreamingJsonlWriter<W> {
    pub fn new(writer: W) -> Self {
        Self { writer }
    }

    pub fn write_row(&mut self, row: FlatRow) -> Result<()> {
        let mut map = Map::new();
        for (k, v) in row {
            // Attempt to restore numbers and booleans
            if let Ok(num) = v.parse::<i64>() {
                map.insert(k, Value::Number(num.into()));
            } else if let Ok(f) = v.parse::<f64>() {
                if let Some(n) = serde_json::Number::from_f64(f) {
                    map.insert(k, Value::Number(n));
                } else {
                    map.insert(k, Value::String(v));
                }
            } else if let Ok(b) = v.parse::<bool>() {
                map.insert(k, Value::Bool(b));
            } else {
                map.insert(k, Value::String(v));
            }
        }

        let json_str = serde_json::to_string(&map)?;
        writeln!(self.writer, "{}", json_str)?;
        Ok(())
    }

    pub fn finish(&mut self) -> Result<()> {
        self.writer.flush()?;
        Ok(())
    }
}
