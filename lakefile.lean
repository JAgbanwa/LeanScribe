import Lake
open Lake DSL

package «leanscribe-extractor» where
  version := v!"0.1.0"

lean_lib LeanScribe where
  roots := #[`LeanScribe.Extractor, `LeanScribe.ExtractorFixture]

lean_exe leanscribe_extract where
  root := `LeanScribe.Extractor
