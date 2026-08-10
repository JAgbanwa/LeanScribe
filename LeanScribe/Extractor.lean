import Lean
import Lean.DeclarationRange
import Lean.DocString
import Lean.Util.CollectAxioms
import Lean.Util.FoldConsts
import Lean.Util.Path

open Lean Meta PrettyPrinter

namespace LeanScribe

structure BinderIR where
  id : String
  name : String
  binderKind : String
  typeText : String
deriving ToJson

structure SourceLocationIR where
  module : String
  startLine : Nat
  startColumn : Nat
  endLine : Nat
  endColumn : Nat
deriving ToJson

structure DeclarationIR where
  id : String
  name : String
  namespaceName : String
  kind : String
  originalCommand : String
  classificationSource : String
  typeText : String
  conclusion : String
  binders : Array BinderIR
  dependencies : Array String
  axioms : Array String
  usesSorry : Bool
  usesNativeEvaluation : Bool
  proofStatus : String
  docString : Option String
  sourceLocation : Option SourceLocationIR
deriving ToJson

structure BundleIR where
  schemaVersion : String := "leanscribe.semantic-ir.v1"
  extractionStatus : String := "elaborated"
  module : String
  leanVersion : String
  leanCommit : String
  generatedAt : String
  declarations : Array DeclarationIR
  trustStatement : String :=
    "Generated from kernel-accepted declarations; prose correspondence still requires coverage checks."
deriving ToJson

def binderKind : BinderInfo → String
  | .default => "explicit"
  | .implicit => "implicit"
  | .strictImplicit => "strict-implicit"
  | .instImplicit => "instance"

def declarationKind : ConstantInfo → String
  | .thmInfo _ => "theorem"
  | .axiomInfo _ => "axiom"
  | .defnInfo _ => "definition"
  | .opaqueInfo _ => "definition"
  | .inductInfo _ => "inductive"
  | .ctorInfo _ => "constructor"
  | .recInfo _ => "recursor"
  | .quotInfo _ => "quotient"

def namespaceOf (name : Name) : String :=
  match name.getPrefix with
  | .anonymous => ""
  | namespaceName => namespaceName.toString

def ppExprString (expr : Expr) : MetaM String := do
  return (← PrettyPrinter.ppExpr expr).pretty

partial def extractBinders
    (declId : String)
    (expr : Expr)
    (acc : Array BinderIR := #[]) : MetaM (Array BinderIR × String) := do
  match expr with
  | .forallE name domain body info =>
      let renderedType ← ppExprString domain
      let binderName := if name.isAnonymous then s!"argument_{acc.size + 1}" else name.toString
      let binder : BinderIR := {
        id := s!"{declId}:binder:{acc.size}"
        name := binderName
        binderKind := binderKind info
        typeText := renderedType
      }
      withLocalDecl name info domain fun freeVar =>
        extractBinders declId (body.instantiate1 freeVar) (acc.push binder)
  | conclusion =>
      return (acc, ← ppExprString conclusion)

def sourceLocation? (moduleName declName : Name) : MetaM (Option SourceLocationIR) := do
  let some ranges ← findDeclarationRanges? declName | return none
  return some {
    module := moduleName.toString
    startLine := ranges.range.pos.line
    startColumn := ranges.range.pos.column
    endLine := ranges.range.endPos.line
    endColumn := ranges.range.endPos.column
  }

def extractDeclaration (moduleName declName : Name) : MetaM DeclarationIR := do
  let info ← getConstInfo declName
  let declId := s!"{moduleName}:{declName}"
  let (binders, conclusion) ← extractBinders declId info.type
  let typeString ← ppExprString info.type
  let axioms ← collectAxioms declName
  let env ← getEnv
  let docString : Option String ← liftM (findDocString? env declName)
  let axiomNames := axioms.map Name.toString
  let dependencies := info.type.getUsedConstants
    |>.filter (· != declName)
    |>.map Name.toString
  let kind := declarationKind info
  return {
    id := declId
    name := declName.toString
    namespaceName := namespaceOf declName
    kind
    originalCommand := kind
    classificationSource := "kernel-kind; editorial theorem/lemma/corollary override not supplied"
    typeText := typeString
    conclusion
    binders
    dependencies
    axioms := axiomNames
    usesSorry := axiomNames.contains "sorryAx"
    usesNativeEvaluation := axiomNames.contains "Lean.trustCompiler"
    proofStatus := if axiomNames.contains "sorryAx" then "incomplete" else "kernel-accepted"
    docString
    sourceLocation := ← sourceLocation? moduleName declName
  }

def extractModule (env : Environment) (moduleName : Name) : MetaM (Array DeclarationIR) := do
  let some moduleIdx := env.getModuleIdx? moduleName
    | throwError "module `{moduleName}` was not found after import"
  let declarationNames := env.const2ModIdx.keysArray.filter fun name =>
    env.getModuleIdxFor? name == some moduleIdx && !name.isInternal
  let declarations ← declarationNames.mapM (extractDeclaration moduleName)
  return declarations.filter (·.sourceLocation.isSome)

unsafe def loadModule (moduleName : Name) : IO Environment := do
  enableInitializersExecution
  importModules (loadExts := true) #[{ module := moduleName }] {}

unsafe def runExtractor (moduleName : Name) : IO BundleIR := do
  let env ← loadModule moduleName
  let coreContext : Core.Context := {
    fileName := s!"<{moduleName}>"
    fileMap := default
  }
  let coreState : Core.State := { env }
  let (declarations, _) ← (extractModule env moduleName).run' |>.toIO coreContext coreState
  let now ← IO.monoMsNow
  return {
    module := moduleName.toString
    leanVersion := Lean.versionString
    leanCommit := Lean.githash
    generatedAt := s!"monotonic-ms:{now}"
    declarations
  }

def usage : String :=
  "Usage: leanscribe_extract <Module.Name> [output.leanscribe.json]\n" ++
  "Run through the target project: lake env /path/to/leanscribe_extract Module.Name"

unsafe def runMain (args : List String) : IO UInt32 := do
  let moduleText :: rest := args | IO.eprintln usage; return 2
  initSearchPath (← findSysroot)
  let moduleName := moduleText.toName
  let bundle ← runExtractor moduleName
  let output := Json.pretty (toJson bundle)
  match rest with
  | [] => IO.println output
  | [path] => IO.FS.writeFile path output
  | _ => IO.eprintln usage; return 2
  return 0

end LeanScribe

unsafe def main (args : List String) : IO UInt32 :=
  LeanScribe.runMain args
