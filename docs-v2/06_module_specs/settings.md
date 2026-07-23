# Module · Settings

| Status | Phase | Service |
|---|---|---|
| 🟢 IMPLEMENTED | 11 | `SettingService.gs` |

## 1. Purpose
ຄ່າລະບົບ + ຈັດການຜູ້ໃຊ້/role.

## 2. Features
get/set setting · list/add user · set role · deactivate user.

## 3. UI (`settingsView.html`)
ຕາຕະລາງ setting + ຕາຕະລາງຜູ້ໃຊ້ (role dropdown).

## 4. API / Data
`apiSettingsAll` · `apiSetSetting` · `apiListUsers` · `apiAddUser` · `apiSetUserRole` · `apiDeactivateUser` → `SettingService.*`. Sheet **Users** (`USR-####`), **Settings**.

## 5. Permissions
setting = Admin+; user management = Owner.

## 6. Acceptance
- [x] ຕັ້ງ role · deactivate · RBAC (Owner)
