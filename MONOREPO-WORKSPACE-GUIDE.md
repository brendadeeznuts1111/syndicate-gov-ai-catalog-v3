# 🏗️ Monorepo Workspace Management Guide

**Generated**: 2025-10-29T14:08:15.231Z  
**Bun Version**: 1.3.1  
**Workspaces**: 2 packages configured

Complete guide to managing enterprise monorepo workspaces with Bun v1.3 using the `--filter` flag for scoped updates and interactive dependency management.

---

## 🎯 **Workspace Configuration**

### **Current Monorepo Structure**

```json
{
  "name": "syndicate-gov-monorepo",
  "version": "1.0.1-beta.0",
  "workspaces": [
    "packages/*"
  ],
  "catalog": {
    "react": "^18.3.3",
    "typescript": "^5.0.6",
    "zod": "^3.24.3",
    "uuid": "^10.0.2"
  },
  "catalogs": {
    "testing": {
      "jest": "29.6.2",
      "react-testing-library": "14.0.0"
    },
    "build": {
      "esbuild": "0.19.0"
    }
  }
}
```

### **Available Workspaces**

| Workspace | Package | Category | Version | Dependencies |
|-----------|---------|----------|---------|--------------|
| `@syndicate/dashboard` | packages/dashboard | Business Intelligence | 3.0.3 | react, react-dom |
| `@syndicate/gov-rules` | packages/gov-rules | Governance | 3.0.3 | zod, uuid |

---

## ⚡ **Workspace Filtering Commands**

### **🔍 Single Workspace Updates**

```bash
# Update dependencies only in @syndicate/dashboard workspace
bun update -i --filter @syndicate/dashboard

# Update specific dependency in dashboard workspace
bun update react --filter @syndicate/dashboard

# Update to latest versions in dashboard only
bun update --latest --filter @syndicate/dashboard
```

**Result Example**:
```bash
bun update react --filter @syndicate/dashboard
bun update v1.3.0 (b0a6feca)
installed react@19.2.0
[691.00ms] done
```

### **🎯 Multiple Workspace Updates**

```bash
# Update dependencies in multiple specific workspaces
bun update -i --filter @syndicate/dashboard --filter @syndicate/gov-rules

# Update shared dependencies across workspaces
bun update typescript --filter @syndicate/dashboard --filter @syndicate/gov-rules

# Interactive update for multiple workspaces
bun update --interactive --filter @syndicate/dashboard --filter @syndicate/gov-rules
```

**Result Example**:
```bash
bun update typescript --filter @syndicate/dashboard --filter @syndicate/gov-rules
bun update v1.3.0 (b0a6feca)
installed typescript@5.9.3 with binaries:
 - tsc
 - tsserver
[777.00ms] done
```

### **📦 Category-Based Updates**

```bash
# Update all business intelligence packages
bun update --filter "*dashboard*"

# Update all governance packages  
bun update --filter "*gov*"

# Update packages by pattern
bun update --filter "@syndicate/*"
```

---

## 🔄 **Interactive Update Scenarios**

### **📊 Interactive Selection Interface**

```bash
# Global interactive update
bun update --interactive

# Workspace-specific interactive update
bun update --interactive --filter @syndicate/dashboard

# Multi-workspace interactive update
bun update --interactive --filter @syndicate/dashboard --filter @syndicate/gov-rules
```

**Expected Interface**:
```
bun update --interactive v1.3.0 (b0a6feca)
? Select packages to update: (Press <space> to select, <a> to toggle all, <i> to invert selection)
❯◯ react@19.2.0 → 19.2.0 (latest)
 ◯ typescript@5.9.3 → 5.9.3 (latest)
 ◯ zod@4.1.12 → 4.1.12 (latest)
```

### **🎯 Practical Scenarios**

#### **Scenario 1: Update Frontend Dependencies**
```bash
# Update only dashboard (React-based) dependencies
bun update react react-dom --filter @syndicate/dashboard

# Interactive update for dashboard workspace
bun update --interactive --filter @syndicate/dashboard
```

#### **Scenario 2: Update Governance Dependencies**
```bash
# Update only gov-rules (Node.js-based) dependencies
bun update zod uuid --filter @syndicate/gov-rules

# Update to latest governance packages
bun update --latest --filter @syndicate/gov-rules
```

#### **Scenario 3: Shared Dependencies**
```bash
# Update TypeScript across all packages
bun update typescript --filter @syndicate/dashboard --filter @syndicate/gov-rules

# Update dev dependencies across workspaces
bun update --dev --filter @syndicate/dashboard --filter @syndicate/gov-rules
```

---

## 📈 **Performance & Optimization**

### **⚡ Update Performance Metrics**

| Operation | Packages | Time | Status |
|-----------|----------|------|--------|
| Single Workspace | 1 | ~600ms | ✅ Optimal |
| Multiple Workspaces | 2 | ~800ms | ✅ Optimal |
| Global Update | All | ~1.2s | ✅ Optimal |
| Interactive Selection | Filtered | ~900ms | ✅ Optimal |

### **🔧 Optimization Features**

```bash
# Use catalog for consistent versions
bun update --from-catalog --filter @syndicate/dashboard

# Dry run to preview changes
bun update --dry-run --filter @syndicate/gov-rules

# Update with specific architecture
bun update --cpu=x64 --filter @syndicate/dashboard

# Update with OS specificity
bun update --os=darwin --filter @syndicate/dashboard
```

---

## 🛠️ **Advanced Filtering Patterns**

### **🎯 Pattern Matching**

```bash
# Wildcard patterns
bun update --filter "@syndicate/*"           # All syndicate packages
bun update --filter "*dashboard*"            # Dashboard-related packages
bun update --filter "*gov*"                  # Governance packages

# Multiple filters
bun update --filter @syndicate/dashboard --filter @syndicate/gov-rules

# Exclusion patterns (using negation)
bun update --filter "*" --filter "!@syndicate/internal"
```

### **📋 Catalog-Based Updates**

```bash
# Update from main catalog
bun update --from-catalog --filter @syndicate/dashboard

# Update from specific catalog
bun update --from-catalog=testing --filter @syndicate/dashboard

# Update multiple catalogs
bun update --from-catalog=testing --from-catalog=build --filter @syndicate/dashboard
```

---

## 🔒 **Security & Compliance**

### **🛡️ Security-Scoped Updates**

```bash
# Security updates only
bun update --audit --filter @syndicate/dashboard

# High severity security updates
bun update --audit --severity=high --filter @syndicate/gov-rules

# Security update with specific workspace
bun update --audit --filter @syndicate/dashboard --filter @syndicate/gov-rules
```

### **📊 Compliance Updates**

```bash
# Update compliance-related packages
bun update --filter @syndicate/gov-rules --audit

# Update with compliance verification
bun update --filter @syndicate/dashboard && bun run compliance:check
```

---

## 📚 **Command Reference**

### **🔍 Essential Commands**

```bash
# Basic filtering
bun update --filter @syndicate/dashboard                    # Single workspace
bun update --filter @syndicate/dashboard --filter @syndicate/gov-rules  # Multiple

# Interactive updates
bun update --interactive                                    # Global interactive
bun update --interactive --filter @syndicate/dashboard     # Workspace-specific

# Latest versions
bun update --latest --filter @syndicate/dashboard          # Latest for workspace
bun update --latest                                         # Global latest

# Specific dependencies
bun update react --filter @syndicate/dashboard             # Specific dep in workspace
bun update typescript --filter @syndicate/dashboard --filter @syndicate/gov-rules  # Shared dep

# Catalog management
bun update --from-catalog --filter @syndicate/dashboard     # From catalog
bun update --from-catalog=testing --filter @syndicate/dashboard  # From specific catalog

# Security & audit
bun update --audit --filter @syndicate/dashboard           # Security updates
bun update --audit --severity=high --filter @syndicate/gov-rules  # High severity only
```

### **⚙️ Advanced Options**

```bash
# Architecture and OS specific
bun update --cpu=x64 --filter @syndicate/dashboard          # Architecture specific
bun update --os=darwin --filter @syndicate/dashboard        # OS specific

# Development dependencies
bun update --dev --filter @syndicate/dashboard              # Dev deps only
bun update --production --filter @syndicate/dashboard       # Production deps only

# Dry run and preview
bun update --dry-run --filter @syndicate/dashboard          # Preview changes
bun update --verbose --filter @syndicate/dashboard          # Detailed output
```

---

## 🎯 **Best Practices**

### **📋 Workspace Management**

1. **Use Specific Filters**: Always target specific workspaces to avoid unintended updates
2. **Leverage Catalog**: Use catalog for consistent version management across workspaces
3. **Interactive Updates**: Use `--interactive` for selective dependency updates
4. **Security First**: Always run `--audit` after updates to ensure security

### **⚡ Performance Optimization**

1. **Scoped Updates**: Use `--filter` to minimize update scope and time
2. **Batch Updates**: Update multiple workspaces together for shared dependencies
3. **Dry Run**: Preview changes before applying updates
4. **Catalog Consistency**: Use catalog for predictable dependency versions

### **🔒 Security Practices**

1. **Regular Audits**: Run security audits after updates
2. **Severity Filtering**: Focus on high-severity vulnerabilities
3. **Workspace Isolation**: Update workspaces independently to limit blast radius
4. **Compliance Verification**: Verify compliance after governance package updates

---

## 📞 **Support & Resources**

### **🔗 Documentation Links**

- **📖 Bun Documentation**: https://bun.sh/docs
- **🚀 Bun v1.3 Blog**: https://bun.com/blog/bun-v1.3#new-commands
- **📦 Package Standards**: ./docs/09-configuration/PACKAGE-METADATA-STANDARD.md
- **🏗️ Monorepo Guide**: ./docs/09-configuration/MONOREPO-SETUP.md

### **🛠️ Related Tools**

- **📊 Package Generator**: ./tools/scripts/package-generator.ts
- **🔍 Compatibility Checker**: ./tools/bun-v1.3-checker.ts
- **🔒 Security Auditor**: ./tools/scripts/security-auditor.ts
- **📈 Performance Monitor**: ./tools/scripts/performance-monitor.ts

---

*Monorepo Workspace Management Guide v3.0 • Enterprise-Grade • Bun v1.3 Optimized • Security-First*
