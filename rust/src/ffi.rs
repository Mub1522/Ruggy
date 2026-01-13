use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::sync::Arc;
use serde_json::Value;
use crate::db::Database;
use crate::collection::Collection;

/// Helper para convertir puntero genérico C a referencia Rust
unsafe fn from_ptr<'a, T>(ptr: *mut T) -> &'a T {
    &*ptr
}

/// Helper para devolver un puntero CString (el que llama debe liberarlo)
fn return_string(s: String) -> *mut c_char {
    CString::new(s).unwrap().into_raw()
}

/// Helper para parsear string C a &str de Rust
unsafe fn to_str<'a>(ptr: *const c_char) -> &'a str {
    if ptr.is_null() { return ""; }
    CStr::from_ptr(ptr).to_str().unwrap_or("")
}

#[no_mangle]
pub extern "C" fn ruggy_open(path: *const c_char) -> *mut Database {
    let path_str = unsafe { to_str(path) };
    match Database::new(path_str) {
        Ok(db) => Box::into_raw(Box::new(db)),
        Err(_) => std::ptr::null_mut(),
    }
}

#[no_mangle]
pub extern "C" fn ruggy_get_collection(db: *mut Database, name: *const c_char) -> *mut Collection {
    if db.is_null() { return std::ptr::null_mut(); }
    let db = unsafe { from_ptr(db) };
    let name_str = unsafe { to_str(name) };
    match db.collection(name_str) {
        Ok(col) => {
            Box::into_raw(Box::new(col.clone())) as *mut Collection
        },
        Err(_) => std::ptr::null_mut(),
    }
}

#[no_mangle]
pub extern "C" fn ruggy_insert(col: *mut Collection, json: *const c_char) -> *mut c_char {
    let col_arc_ptr = col as *mut Arc<Collection>;
    let col = unsafe { &*col_arc_ptr };

    let json_str = unsafe { to_str(json) };
    let json_val: Value = match serde_json::from_str(json_str) {
        Ok(v) => v,
        Err(_) => return std::ptr::null_mut(),
    };

    match col.insert(json_val) {
        Ok(id) => return_string(id),
        Err(_) => std::ptr::null_mut(),
    }
}

#[no_mangle]
pub extern "C" fn ruggy_find_all(col: *mut Collection) -> *mut c_char {
    let col_arc_ptr = col as *mut Arc<Collection>;
    let col = unsafe { &*col_arc_ptr };

    let docs = col.find_all();
    let json_out = serde_json::to_string(&docs).unwrap_or_else(|_| "[]".to_string());
    return_string(json_out)
}

#[no_mangle]
pub extern "C" fn ruggy_find(col: *mut Collection, field: *const c_char, value: *const c_char) -> *mut c_char {
    let col_arc_ptr = col as *mut Arc<Collection>;
    let col = unsafe { &*col_arc_ptr };
    
    let f_str = unsafe { to_str(field) };
    let v_str = unsafe { to_str(value) };

    let docs = col.find(f_str, v_str);
    let json_out = serde_json::to_string(&docs).unwrap_or_else(|_| "[]".to_string());
    return_string(json_out)
}

#[no_mangle]
pub extern "C" fn ruggy_find_op(
    col: *mut Collection, 
    field: *const c_char, 
    value: *const c_char,
    operator: *const c_char
) -> *mut c_char {
    let col_arc_ptr = col as *mut Arc<Collection>;
    let col = unsafe { &*col_arc_ptr };
    
    let f_str = unsafe { to_str(field) };
    let v_str = unsafe { to_str(value) };
    let op_str = unsafe { to_str(operator) };

    let docs = col.find_with_operator(f_str, v_str, op_str);
    let json_out = serde_json::to_string(&docs).unwrap_or_else(|_| "[]".to_string());
    return_string(json_out)
}

#[no_mangle]
pub extern "C" fn ruggy_update_field(
    col: *mut Collection,
    id: *const c_char,
    field: *const c_char,
    value_json: *const c_char
) -> i32 {
    let col_arc_ptr = col as *mut Arc<Collection>;
    let col = unsafe { &*col_arc_ptr };

    let id_str = unsafe { to_str(id) };
    let field_str = unsafe { to_str(field) };
    let val_json_str = unsafe { to_str(value_json) };

    let val: Value = match serde_json::from_str(val_json_str) {
        Ok(v) => v,
        Err(_) => {
            eprintln!("Ruggy Error: Failed to parse update JSON");
            return 0;
        },
    };

    match col.update_field(id_str, field_str, val) {
        Ok(success) => {
            if success { 1 } else { 0 }
        },
        Err(e) => {
            eprintln!("Ruggy Error: Update failed: {}", e);
            0
        },
    }
}

#[no_mangle]
pub extern "C" fn ruggy_delete(
    col: *mut Collection,
    id: *const c_char
) -> i32 {
    let col_arc_ptr = col as *mut Arc<Collection>;
    let col = unsafe { &*col_arc_ptr };

    let id_str = unsafe { to_str(id) };

    match col.delete_by_id(id_str) {
        Ok(success) => {
            if success { 1 } else { 0 }
        },
        Err(e) => {
            eprintln!("Ruggy Error: Delete failed: {}", e);
            0
        },
    }
}

// --- Destructores ---

#[no_mangle]
pub extern "C" fn ruggy_db_free(db: *mut Database) {
    if !db.is_null() {
        unsafe { let _ = Box::from_raw(db); }
    }
}

#[no_mangle]
pub extern "C" fn ruggy_col_free(col: *mut Collection) {
    if !col.is_null() {
        let col_arc_ptr = col as *mut Arc<Collection>;
        unsafe { let _ = Box::from_raw(col_arc_ptr); }
    }
}

#[no_mangle]
pub extern "C" fn ruggy_str_free(s: *mut c_char) {
    if !s.is_null() {
        unsafe { let _ = CString::from_raw(s); }
    }
}
