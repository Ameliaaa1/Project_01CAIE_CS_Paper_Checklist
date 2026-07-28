# PR-028_Production_Expansion_Phase_A_Execution_Plan

## Title

Production Expansion Phase A Execution Plan

------------------------------------------------------------------------

# 1. Background

Current project status:

``` text
Parser Development
        COMPLETE

Phase 1 Validation
        PASS

Phase 2 Validation
        PASS

Issue Resolution
        COMPLETE
```

Completed fixes:

``` text
PR-030 Response Area Mapping Fix
PASS

PR-031 Legacy Glyph Classification Fix
PASS

PR-032 Mark Sum Validation Fix
PASS
```

Current stage:

``` text
Production Expansion Preparation
```

------------------------------------------------------------------------

# 2. Current System Status

Current architecture:

``` text
PDF

↓

Parser

↓

Canonical Model

↓

Staging

↓

Validation

↓

Canonical Completeness Gate

↓

Publish Gate

↓

Production
```

All upstream validation layers are stable.

------------------------------------------------------------------------

# 3. Production Expansion Goal

The goal of this phase:

Move validated staging data into Production.

Important:

This is NOT:

-   Parser development
-   Data correction
-   Schema migration

This is:

``` text
Validated Data Publication
```

------------------------------------------------------------------------

# 4. Phase A Scope

Only publish approved pilot scope.

Target:

``` text
0478 Computer Science

2023 May/June

Question Papers

Component:

11
12
13
21
22
23
```

No expansion to:

-   unsupported syllabus
-   unvalidated papers
-   new parser profiles

------------------------------------------------------------------------

# 5. Pre-Publish Requirements

Before writing Production, every paper must satisfy:

## Document Validation

Required:

``` text
documentRole = question_paper
validationStatus = PASS
```

------------------------------------------------------------------------

## Canonical Completeness Gate

Required:

``` text
questionCoverage PASS

leafCoverage PASS

markCoverage PASS

responseAreaCoverage PASS

sourceTraceCoverage PASS

canonicalStructureCompleteness PASS
```

------------------------------------------------------------------------

## Regression Status

Required:

``` text
Phase 1:
20/20 PASS

Phase 2:
120/120 PASS

PR-030:
PASS

PR-031:
PASS

PR-032:
PASS
```

------------------------------------------------------------------------

# 6. Publish Workflow

Execute:

``` text
Staging

↓

Publish Gate

↓

Admin Approval

↓

Production Write

↓

Production Verification
```

------------------------------------------------------------------------

# 7. Production Write Rules

Production write must:

-   use existing Canonical Model
-   preserve stable IDs
-   preserve source trace
-   preserve file hash
-   preserve parser version

Do not:

-   regenerate IDs
-   reparse PDFs during migration
-   modify canonical content during publish
-   bypass validation

------------------------------------------------------------------------

# 8. Production Pilot Verification

After publishing, verify:

## Question Finder

Check:

-   paper searchable
-   question hierarchy correct
-   leaf questions available

------------------------------------------------------------------------

## Knowledge Checklist

Check:

-   syllabus mapping
-   question linkage
-   marks visibility

------------------------------------------------------------------------

## Mark Scheme Search

Check:

-   question paper linkage
-   mark scheme retrieval

------------------------------------------------------------------------

## AI Retrieval

Check:

-   canonical text available
-   source trace available
-   retrieval references correct

------------------------------------------------------------------------

# 9. Rollback Strategy

If Production verification fails:

Rollback:

``` text
Remove published records

↓

Keep staging data

↓

Investigate issue

↓

Create new PR if required
```

Do not modify production data manually.

------------------------------------------------------------------------

# 10. Forbidden Actions

During this phase:

Do not:

-   redesign parser
-   modify question splitting
-   change canonical schema
-   disable validation
-   publish unsupported syllabus
-   publish unvalidated PDFs

------------------------------------------------------------------------

# 11. Acceptance Criteria

Phase A completed when:

``` text
All target papers published

AND

Production queries return correct data

AND

Frontend workflows pass

AND

No regression detected
```

------------------------------------------------------------------------

# 12. Next Phase After Completion

After Phase A success:

Proceed to:

``` text
Full Production Expansion
```

Possible scope:

-   remaining 0478 papers
-   9618 papers

Only after:

-   ingestion coverage review
-   completeness gate review
-   production performance check

------------------------------------------------------------------------

# Final Principle

Current project phase:

``` text
From Data Validation

↓

To Controlled Publication
```

Execution rule:

``` text
Validate First

Publish Second

Verify Third
```

Maintain:

``` text
Minimal Change Principle

One Controlled Release At A Time

No Stable Module Regression
```

END
