/**
 * DriveRepository.gs — Google Drive access (see docs-v2/04).
 * ຈັດການໂຟເດີ/ໄຟລ໌. ທຸກ path ຢູ່ໃຕ້ root CONFIG.DRIVE.root.
 */
class DriveRepository {
  constructor(rootName) {
    this._rootName = rootName || CONFIG.DRIVE.root;
    this._root = null;
  }

  _childFolder(parent, name) {
    const it = parent.getFoldersByName(name);
    if (it.hasNext()) return it.next();
    return parent.createFolder(name);
  }

  /**
   * The DAMS root folder. If Script Property ROOT_FOLDER_ID is set (shared folder),
   * use it so ALL users write to the same place. Otherwise create under My Drive.
   */
  root() {
    if (!this._root) {
      const id = getProp_('ROOT_FOLDER_ID');
      this._root = id
        ? DriveApp.getFolderById(id)
        : this._childFolder(DriveApp.getRootFolder(), this._rootName);
    }
    return this._root;
  }

  /** Get or create a folder at a relative path array; idempotent. */
  getOrCreateFolderPath(parts) {
    let folder = this.root();
    (parts || []).forEach((name) => {
      folder = this._childFolder(folder, String(name));
    });
    return folder;
  }

  /** Upload a blob into a path; returns the created file. */
  uploadTo(parts, blob, name) {
    const folder = this.getOrCreateFolderPath(parts);
    const file = folder.createFile(blob);
    if (name) file.setName(name);
    return file;
  }

  /** Move a file to the recycle-bin folder (soft delete). */
  softDelete(file) {
    const bin = this.getOrCreateFolderPath([CONFIG.DRIVE.recycleBin]);
    if (file.moveTo) return file.moveTo(bin);
    bin.addFile(file);
    return file;
  }
}
