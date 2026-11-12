/**
 * L3 iOS dosyalarını pbxproj'a bağlar (idempotent).
 * Windows'ta Swift/xcode_spm_setup yokken kullanılır.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PBX = path.join(__dirname, "../ios/App/App.xcodeproj/project.pbxproj");
let pbx = fs.readFileSync(PBX, "utf8");
let changed = false;

const ensure = (label, test, apply) => {
  if (test(pbx)) {
    console.log("·", label);
    return;
  }
  pbx = apply(pbx);
  changed = true;
  console.log("✓", label);
};

ensure(
  "PBXBuildFile GoogleService-Info.plist",
  (s) => s.includes("GoogleService-Info.plist in Resources */ = {isa = PBXBuildFile"),
  (s) =>
    s.replace(
      "/* End PBXBuildFile section */",
      `\t\tE8A1PLST2FED79650016851F /* GoogleService-Info.plist in Resources */ = {isa = PBXBuildFile; fileRef = E8A1PLST1FED79650016851F /* GoogleService-Info.plist */; };\n/* End PBXBuildFile section */`
    )
);

ensure(
  "PBXFileReference App.entitlements",
  (s) => s.includes("path = App.entitlements"),
  (s) =>
    s.replace(
      "/* End PBXFileReference section */",
      `\t\tE8A1ENTL1FED79650016851F /* App.entitlements */ = {isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = App.entitlements; sourceTree = "<group>"; };\n\t\tE8A1PLST1FED79650016851F /* GoogleService-Info.plist */ = {isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = text.plist.xml; path = "GoogleService-Info.plist"; sourceTree = "<group>"; };\n/* End PBXFileReference section */`
    )
);

ensure(
  "App group children",
  (s) => s.includes("E8A1ENTL1FED79650016851F /* App.entitlements */,"),
  (s) =>
    s.replace(
      "\t\t\t\t504EC3131FED79650016851F /* Info.plist */,\n\t\t\t\t2FAD9762203C412B000D30F8 /* config.xml */,",
      "\t\t\t\t504EC3131FED79650016851F /* Info.plist */,\n\t\t\t\tE8A1ENTL1FED79650016851F /* App.entitlements */,\n\t\t\t\tE8A1PLST1FED79650016851F /* GoogleService-Info.plist */,\n\t\t\t\t2FAD9762203C412B000D30F8 /* config.xml */,"
    )
);

ensure(
  "Resources build phase",
  (s) => s.includes("E8A1PLST2FED79650016851F /* GoogleService-Info.plist in Resources */,"),
  (s) =>
    s.replace(
      "files = (\n\t\t\t\t504EC3121FED79650016851F /* LaunchScreen.storyboard in Resources */,",
      "files = (\n\t\t\t\tE8A1PLST2FED79650016851F /* GoogleService-Info.plist in Resources */,\n\t\t\t\t504EC3121FED79650016851F /* LaunchScreen.storyboard in Resources */,"
    )
);

ensure(
  "CODE_SIGN_ENTITLEMENTS Debug+Release",
  (s) => (s.match(/CODE_SIGN_ENTITLEMENTS = App\/App.entitlements;/g) || []).length >= 2,
  (s) =>
    s.replace(
      /CODE_SIGN_STYLE = Automatic;\n(\t\t\t\tCURRENT_PROJECT_VERSION = 1;\n\t\t\t\tINFOPLIST_FILE = App\/Info.plist;)/g,
      "CODE_SIGN_STYLE = Automatic;\n\t\t\t\tCODE_SIGN_ENTITLEMENTS = App/App.entitlements;\n$1"
    )
);

if (changed) fs.writeFileSync(PBX, pbx, "utf8");
console.log(changed ? "Updated " + PBX : "No changes needed");
