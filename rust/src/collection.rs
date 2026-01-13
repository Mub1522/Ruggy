use std::fs::{self, File, OpenOptions};
use std::io::{self, BufRead, BufReader, BufWriter, Write};
use std::path::PathBuf;
use std::sync::Arc;
use parking_lot::{Mutex, RwLock};
use serde_json::Value;
use uuid::Uuid;

pub struct Collection {
    #[allow(dead_code)]
    name: String,
    #[allow(dead_code)]
    file_path: PathBuf,
    pub(crate) data: RwLock<Vec<Value>>,
    pub(crate) writer: Mutex<BufWriter<File>>,
}

impl Collection {
    pub fn new(name: &str, file_path: PathBuf) -> io::Result<Self> {
        let file = OpenOptions::new()
            .create(true)
            .append(true)
            .read(true)
            .open(&file_path)?;
            
        let mut data = Vec::new();
        let reader = BufReader::new(&file);
        for line in reader.lines() {
            let line = line?;
            if !line.trim().is_empty() {
                if let Ok(value) = serde_json::from_str::<Value>(&line) {
                    data.push(value);
                }
            }
        }
        let write_file = OpenOptions::new()
            .create(true)
            .write(true)
            .open(&file_path)?;
            
        Ok(Self {
            name: name.to_string(),
            file_path,
            data: RwLock::new(data),
            writer: Mutex::new(BufWriter::new(write_file)),
        })
    }

    pub fn insert(&self, mut document: Value) -> io::Result<String> {
        use std::io::{Seek, SeekFrom};
        let id = Uuid::new_v4().to_string();
        if let Some(obj) = document.as_object_mut() {
            obj.insert("_id".to_string(), Value::String(id.clone()));
        } else {
            return Err(io::Error::new(io::ErrorKind::InvalidInput, "Not an object"));
        }
        let json_line = serde_json::to_string(&document)?;
        {
            let mut writer = self.writer.lock();
            // Asegurarse de estar al final para el insert
            writer.flush()?;
            let file = writer.get_mut();
            file.seek(SeekFrom::End(0))?;
            
            writeln!(writer, "{}", json_line)?;
            writer.flush()?;
        }
        {
            let mut data = self.data.write();
            data.push(document);
        }
        Ok(id)
    }

    pub fn find_all(&self) -> Vec<Value> {
        let data = self.data.read();
        data.clone()
    }

    pub fn find(&self, field: &str, value: &str) -> Vec<Value> {
        let data = self.data.read();
        data.iter()
            .filter(|doc| {
                match doc.get(field) {
                    Some(Value::String(s)) => s == value,
                    _ => false,
                }
            })
            .cloned()
            .collect()
    }

    pub fn find_with_operator(&self, field: &str, value: &str, operator: &str) -> Vec<Value> {
        let data = self.data.read();
        data.iter()
            .filter(|doc| {
                match doc.get(field) {
                    Some(Value::String(s)) => {
                        match operator {
                            "=" | "==" | "eq" => s == value,
                            "like" | "LIKE" | "contains" => s.contains(value),
                            "starts_with" => s.starts_with(value),
                            "ends_with" => s.ends_with(value),
                            _ => false,
                        }
                    },
                    Some(Value::Number(n)) => {
                        if operator == "=" || operator == "==" || operator == "eq" {
                            n.to_string() == value
                        } else {
                            false
                        }
                    },
                    _ => false,
                }
            })
            .cloned()
            .collect()
    }

    pub fn update_field(&self, id: &str, field: &str, value: Value) -> io::Result<bool> {
        let mut data = self.data.write();
        let mut updated = false;

        for doc in data.iter_mut() {
            if let Some(doc_id) = doc.get("_id").and_then(|v| v.as_str()) {
                if doc_id == id {
                    if let Some(obj) = doc.as_object_mut() {
                        obj.insert(field.to_string(), value);
                        updated = true;
                        break;
                    }
                }
            }
        }

        if updated {
            drop(data);
            self.persist()?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    pub fn delete_by_id(&self, id: &str) -> io::Result<bool> {
        let mut data = self.data.write();
        let mut index_to_remove = None;

        for (i, doc) in data.iter().enumerate() {
            if let Some(doc_id) = doc.get("_id").and_then(|v| v.as_str()) {
                if doc_id == id {
                    index_to_remove = Some(i);
                    break;
                }
            }
        }

        if let Some(index) = index_to_remove {
            data.remove(index);
            drop(data);
            self.persist()?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    pub fn persist(&self) -> io::Result<()> {
        use std::io::{Seek, SeekFrom};
        let data = self.data.read();
        let mut writer = self.writer.lock();
        
        // Limpiar el buffer actual y truncar el archivo usando el mismo handle
        writer.flush()?;
        let file = writer.get_mut();
        file.set_len(0)?;
        file.seek(SeekFrom::Start(0))?;
        
        // Re-escribir todos los documentos
        for doc in data.iter() {
            let json_line = serde_json::to_string(doc)?;
            writeln!(writer, "{}", json_line)?;
        }
        writer.flush()?;
        
        Ok(())
    }
}
