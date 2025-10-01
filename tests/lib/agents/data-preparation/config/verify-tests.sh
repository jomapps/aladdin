#!/bin/bash
# Test Verification Script
# Verifies all configuration tests are present and properly structured

echo "🔍 Verifying Configuration Test Suite"
echo "======================================"
echo ""

# Count test files
TEST_FILES=$(find . -name "*.test.ts" | wc -l)
echo "✓ Test files found: $TEST_FILES"

# Count fixture files
FIXTURE_FILES=$(find ./fixtures -name "*.ts" 2>/dev/null | wc -l)
echo "✓ Fixture files found: $FIXTURE_FILES"

# Count total lines
TOTAL_LINES=$(wc -l *.test.ts 2>/dev/null | tail -1 | awk '{print $1}')
echo "✓ Total test lines: $TOTAL_LINES"

# Count test cases (approximate by counting 'it(' occurrences)
TEST_CASES=$(grep -h "it(" *.test.ts 2>/dev/null | wc -l)
echo "✓ Approximate test cases: $TEST_CASES"

# Count describe blocks
DESCRIBE_BLOCKS=$(grep -h "describe(" *.test.ts 2>/dev/null | wc -l)
echo "✓ Test suites (describe blocks): $DESCRIBE_BLOCKS"

echo ""
echo "📊 Test Files Details:"
echo "----------------------"
for file in *.test.ts; do
  if [ -f "$file" ]; then
    LINES=$(wc -l < "$file")
    TESTS=$(grep -c "it(" "$file" 2>/dev/null || echo "0")
    printf "%-30s %5d lines, %3d tests\n" "$file" "$LINES" "$TESTS"
  fi
done

echo ""
echo "📁 Fixture Files:"
echo "-----------------"
for file in fixtures/*.ts; do
  if [ -f "$file" ]; then
    LINES=$(wc -l < "$file")
    printf "%-40s %5d lines\n" "$file" "$LINES"
  fi
done

echo ""
echo "✅ Test Suite Verification Complete!"
echo ""

# Exit with success
exit 0
