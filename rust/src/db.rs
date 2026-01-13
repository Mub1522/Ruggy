use std::collections::HashMap;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use parking_lot::RwLock;
use crate::collection::Collection;

pub struct Database {
    pub(crate) root_path: PathBuf,
    pub(crate) collections: RwLock<HashMap<String, Arc<Collection>>>,
}

impl Database {
    pub fn new<P: AsRef<Path>>(path: P) -> io::Result<Self> {
        let root_path = path.as_ref().to_path_buf();
        if !root_path.exists() {
            fs::create_dir_all(&root_path)?;
        }
        Ok(Self {
            root_path,
            collections: RwLock::new(HashMap::new()),
        })
    }

    pub fn collection(&self, name: &str) -> io::Result<Arc<Collection>> {
        {
            let cols = self.collections.read();
            if let Some(col) = cols.get(name) {
                return Ok(col.clone());
            }
        }
        let mut cols = self.collections.write();
        if let Some(col) = cols.get(name) {
            return Ok(col.clone());
        }
        let col_path = self.root_path.join(format!("{}.col", name));
        let collection = Arc::new(Collection::new(name, col_path)?);
        cols.insert(name.to_string(), collection.clone());
        Ok(collection)
    }
}
