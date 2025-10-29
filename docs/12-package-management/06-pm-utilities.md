# 🛠️ Package Manager Utilities - Bun PM Guide

**Generated**: 2025-10-29T14:19:45.231Z  
**Bun Version**: 1.3.1  
**PM Utilities**: Complete package manager toolkit  
**Integration**: Enterprise monorepo-ready

Complete guide to using `bun pm` utilities for package management operations, tarball creation, dependency analysis, and enterprise package maintenance.

---

## 🛠️ **Bun PM Overview**

### **🎯 Utility Categories**

**Package Management Utilities**:
- **pack**: Create distributable tarballs for publishing
- **ls**: List and analyze installed dependencies
- **bin**: Locate binary directories for executables
- **cache**: Manage global module cache
- **hash**: Generate and verify lockfile hashes

**Development & Maintenance**:
- **version**: Bump package versions with git integration
- **pkg**: Manage package.json data programmatically
- **migrate**: Convert other package manager lockfiles
- **trust**: Manage trusted dependencies for security

---

## 📦 **Package Packing & Publishing**

### **🎯 Basic Tarball Creation**

```bash
# Create tarball of current workspace
bun pm pack

# Output example:
bun pack v1.3.0 (b0a6feca)

packed 2.1kB package.json
packed 845B index.js
packed 1.2kB README.md

@syndicate/dashboard-3.0.3.tgz

Total files: 3
Shasum: f2451d6eb1e818f500a791d9aace80b394258a90
Unpacked size: 4.2kB
Packed size: 1.8kB
```

### **🔧 Advanced Packing Options**

**Custom Destination**:
```bash
# Save to specific directory
bun pm pack --destination ./dist

# Output: ./dist/@syndicate/dashboard-3.0.3.tgz
```

**Quiet Mode for Automation**:
```bash
# Capture filename for scripting
TARBALL=$(bun pm pack --quiet)
echo "Created tarball: $TARBALL"

# Output: @syndicate/dashboard-3.0.3.tgz
```

**Custom Compression**:
```bash
# Set compression level (0-9, default 9)
bun pm pack --gzip-level 6

# Faster but larger files
bun pm pack --gzip-level 1
```

**Dry Run Analysis**:
```bash
# Preview what would be included
bun pm pack --dry-run

# Shows files that would be packed without creating tarball
```

### **🚀 Enterprise Publishing Workflow**

```bash
#!/bin/bash
# scripts/enterprise-publish.sh

echo "📦 Enterprise Package Publishing"
echo "==============================="

# 1. Validate package
bun pm pkg fix
bun run test
bun run build

# 2. Create tarball with analysis
echo "📋 Creating package tarball..."
TARBALL=$(bun pm pack --quiet)
echo "✅ Created: $TARBALL"

# 3. Verify package integrity
echo "🔍 Verifying package integrity..."
bun pm pack --dry-run --verbose

# 4. Generate checksum
echo "🔐 Generating checksum..."
SHA=$(sha256sum "$TARBALL" | cut -d' ' -f1)
echo "SHA256: $SHA"

# 5. Publish to registry
echo "🚀 Publishing to registry..."
bun publish "$TARBALL"

echo "✅ Publishing complete!"
```

---

## 📊 **Dependency Analysis & Management**

### **🔍 List Installed Dependencies**

**Basic Dependency Listing**:
```bash
# List direct dependencies only
bun pm ls

# Output example:
/Users/nolarose/CascadeProjects/🎯 Production Apex- AI-Catalog v3.0 Immortal/node_modules (29)
├── @syndicate/dashboard@workspace:packages/dashboard
├── @syndicate/gov-rules@workspace:packages/gov-rules
├── react@18.3.3
├── react-dom@18.3.3
├── typescript@5.9.3
├── zod@4.1.12
├── uuid@13.0.0
└── express@5.1.0
```

**Complete Dependency Tree**:
```bash
# List all dependencies including transitive
bun pm ls --all

# Shows full dependency tree with all nested packages
```

**Workspace-Specific Analysis**:
```bash
# Check dependencies in specific workspace
cd packages/dashboard && bun pm ls

cd packages/gov-rules && bun pm ls
```

### **📈 Performance Analysis**

```bash
# Analyze package sizes
bun pm ls --size

# Output shows disk usage:
/Users/nolarose/CascadeProjects/.../node_modules (29)
├── @syndicate/dashboard@workspace:packages/dashboard  (45.2kB)
├── @syndicate/gov-rules@workspace:packages/gov-rules   (38.7kB)
├── react@18.3.3                                      (2.8MB)
├── typescript@5.9.3                                  (1.2MB)
└── zod@4.1.12                                        (89.3kB)

Total size: 4.2MB
```

### **🔍 Dependency Insights**

```bash
#!/bin/bash
# scripts/dependency-insights.sh

echo "📊 Dependency Analysis Report"
echo "Generated: $(date)"
echo "==========================="

# Total dependency count
echo "📦 Total Dependencies:"
bun pm ls | wc -l | xargs echo "Direct dependencies:"
bun pm ls --all | wc -l | xargs echo "Total dependencies:"

# Workspace analysis
echo ""
echo "🏗️ Workspace Dependencies:"
echo "Dashboard workspace:"
cd packages/dashboard && bun pm ls | wc -l | xargs echo "  Dependencies:"

echo "Gov-rules workspace:"
cd ../gov-rules && bun pm ls | wc -l | xargs echo "  Dependencies:"

# Size analysis
echo ""
echo "💾 Size Analysis:"
bun pm ls --size | tail -5

# Security status
echo ""
echo "🔒 Security Status:"
bun audit --recursive --severity=high
```

---

## 🔧 **Binary & Cache Management**

### **🎯 Binary Directory Management**

**Local Binary Directory**:
```bash
# Show local node_modules/.bin path
bun pm bin

# Output: /path/to/project/node_modules/.bin

# Use in scripts
LOCAL_BIN=$(bun pm bin)
$LOCAL_BIN/eslint --version
```

**Global Binary Directory**:
```bash
# Show global bin directory
bun pm bin -g

# Output: /Users/nolarose/.bun/bin

# List globally installed binaries
ls $(bun pm bin -g)
```

### **🗄️ Cache Management**

**Cache Location**:
```bash
# Show cache directory path
bun pm cache

# Output: /Users/nolarose/.bun/cache
```

**Cache Operations**:
```bash
# Clear global cache
bun pm cache rm

# Cache size analysis
du -sh $(bun pm cache)

# Force cache refresh
bun install --force
```

**Cache Optimization**:
```bash
#!/bin/bash
# scripts/cache-optimization.sh

echo "🗄️ Cache Optimization"
echo "===================="

# Show cache status
echo "📊 Cache location: $(bun pm cache)"
echo "💾 Cache size: $(du -sh $(bun pm cache) | cut -f1)"

# Clear cache if large
CACHE_SIZE=$(du -s $(bun pm cache) | cut -f1)
if [ "$CACHE_SIZE" -gt 1048576 ]; then  # 1GB
    echo "🧹 Clearing large cache..."
    bun pm cache rm
    echo "✅ Cache cleared"
fi

# Optimize for current project
echo "⚡ Optimizing project cache..."
bun install --frozen-lockfile
echo "✅ Cache optimized"
```

---

## 🏷️ **Version Management**

### **📈 Version Bumping Operations**

**Basic Version Increments**:
```bash
# Patch version (1.0.0 → 1.0.1)
bun pm version patch

# Minor version (1.0.1 → 1.1.0)
bun pm version minor

# Major version (1.1.0 → 2.0.0)
bun pm version major
```

**Prerelease Management**:
```bash
# Prerelease (1.0.0 → 1.0.1-0)
bun pm version prerelease

# Beta prerelease (1.0.0 → 1.0.1-beta.0)
bun pm version prerelease --preid beta

# Alpha prerelease with custom message
bun pm version preminor --preid alpha --message "Alpha release: %s"
```

**Custom Version Setting**:
```bash
# Set specific version
bun pm version 1.2.3

# Set version without git tag
bun pm version 1.2.3 --no-git-tag-version

# Force version bump (bypass dirty git check)
bun pm version patch --force
```

### **🚀 Enterprise Version Workflow**

```bash
#!/bin/bash
# scripts/release-workflow.sh

echo "🚀 Enterprise Release Workflow"
echo "=============================="

# 1. Pre-release checks
echo "🔍 Running pre-release checks..."
bun run test
bun run lint
bun run build

# 2. Version bump
VERSION_TYPE=$1
PREID=${2:-""}

if [ -n "$PREID" ]; then
    echo "📦 Bumping $VERSION_TYPE version with prerelease $PREID..."
    bun pm version $VERSION_TYPE --preid $PREID --message "Release %s"
else
    echo "📦 Bumping $VERSION_TYPE version..."
    bun pm version $VERSION_TYPE --message "Release %s"
fi

# 3. Create release artifacts
echo "📦 Creating release artifacts..."
mkdir -p dist
TARBALL=$(bun pm pack --destination ./dist --quiet)

# 4. Generate changelog
echo "📋 Generating changelog..."
bun run changelog

# 5. Push to git
echo "📤 Pushing to git..."
git push origin main --tags

echo "✅ Release complete! Artifact: $TARBALL"
```

---

## 📝 **Package.json Management**

### **🔍 Data Retrieval Operations**

**Basic Property Access**:
```bash
# Get single property
bun pm pkg get name
# Output: syndicate-gov-monorepo

# Get multiple properties
bun pm pkg get name version
# Output:
# syndicate-gov-monorepo
# 3.0.3

# Get nested property
bun pm pkg get scripts.build
# Output: esbuild src/index.ts --bundle --outfile=dist/index.js
```

**Advanced Access Patterns**:
```bash
# Array access
bun pm pkg get contributors[0]

# Workspace access
bun pm pkg get workspaces[0]

# Special characters with brackets
bun pm pkg get "scripts[test:watch]"
```

### **✏️ Data Modification Operations**

**Set Properties**:
```bash
# Set single property
bun pm pkg set description="Enhanced monorepo with catalog support"

# Set multiple properties
bun pm pkg set version="3.0.4" author="Enterprise Team"

# Set nested properties
bun pm pkg set scripts.dev="bun run dev"

# Set JSON values
bun pm pkg set '{"repository":{"type":"git","url":"https://github.com/org/repo"}}' --json
```

**Delete Properties**:
```bash
# Delete single property
bun pm pkg delete description

# Delete multiple properties
bun pm pkg delete description homepage

# Delete nested properties
bun pm pkg delete scripts.dev
```

### **🔧 Automated Package Management**

```bash
#!/bin/bash
# scripts/package-maintenance.sh

echo "🔧 Package Maintenance Automation"
echo "================================="

# 1. Fix common issues
echo "🔧 Auto-fixing package.json issues..."
bun pm pkg fix

# 2. Update metadata
echo "📝 Updating package metadata..."
bun pm pkg set "updated=$(date -Iseconds)"

# 3. Ensure required fields
echo "✅ Ensuring required fields..."
bun pm pkg set license="MIT" --if-missing
bun pm pkg set repository.type="git" --if-missing

# 4. Validate package.json
echo "🔍 Validating package.json..."
bun pm pkg get | jq . > /tmp/package-validation.json

# 5. Update workspace versions
echo "🏗️ Updating workspace versions..."
cd packages/dashboard
bun pm pkg set version="3.0.4"

cd ../gov-rules
bun pm pkg set version="3.0.4"

echo "✅ Package maintenance complete!"
```

---

## 🔒 **Security & Trust Management**

### **🛡️ Trust Management**

**Check Untrusted Dependencies**:
```bash
# List untrusted dependencies with scripts
bun pm untrusted

# Output example:
./node_modules/@biomejs/biome @1.8.3
 » [postinstall]: node scripts/postinstall.js

These dependencies had their lifecycle scripts blocked during install.
```

**Trust Dependencies**:
```bash
# Trust specific dependency
bun pm trust @biomejs/biome

# Trust all untrusted dependencies
bun pm trust --all
```

**Default Trust List**:
```bash
# Show default trusted dependencies
bun pm default-trusted

# View current list on GitHub
# https://github.com/oven-sh/bun/blob/main/src/install/default-trusted-dependencies.txt
```

### **🔐 Security Workflow**

```bash
#!/bin/bash
# scripts/security-workflow.sh

echo "🔒 Security Management Workflow"
echo "=============================="

# 1. Audit dependencies
echo "🔍 Running security audit..."
bun audit --recursive

# 2. Check untrusted dependencies
echo "🛡️ Checking untrusted dependencies..."
bun pm untrusted

# 3. Review trust decisions
echo "📋 Reviewing trust decisions..."
echo "Default trusted dependencies:"
bun pm default-trusted | head -10

# 4. Trust verified dependencies
read -p "Trust all untrusted dependencies? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔓 Trusting untrusted dependencies..."
    bun pm trust --all
fi

# 5. Verify security posture
echo "✅ Security verification complete!"
```

---

## 🔄 **Migration & Integration**

### **📦 Lockfile Migration**

**Migrate from Other Package Managers**:
```bash
# Migrate npm lockfile
bun pm migrate

# Converts package-lock.json to bun.lock
# Or yarn.lock, pnpm-lock.yaml, etc.
```

**Migration Workflow**:
```bash
#!/bin/bash
# scripts/migrate-to-bun.sh

echo "🔄 Migrating to Bun Package Manager"
echo "=================================="

# 1. Backup existing lockfiles
echo "💾 Backing up existing lockfiles..."
find . -name "*lock*" -not -path "./node_modules/*" -exec cp {} {}.backup \;

# 2. Migrate lockfiles
echo "📦 Migrating lockfiles to Bun..."
bun pm migrate

# 3. Install dependencies
echo "⬇️ Installing dependencies..."
bun install

# 4. Verify installation
echo "✅ Verifying installation..."
bun pm ls
bun run test

echo "🎯 Migration complete!"
```

---

## 📊 **Performance & Analytics**

### **⚡ Performance Monitoring**

```bash
#!/bin/bash
# scripts/performance-monitor.sh

echo "📊 Package Manager Performance"
echo "============================="

# Install performance
echo "⚡ Install performance:"
time bun install

# Cache performance
echo ""
echo "🗄️ Cache performance:"
CACHE_SIZE=$(du -sh $(bun pm cache) | cut -f1)
echo "Cache size: $CACHE_SIZE"

# Dependency count analysis
echo ""
echo "📦 Dependency analysis:"
TOTAL_DEPS=$(bun pm ls --all | wc -l)
DIRECT_DEPS=$(bun pm ls | wc -l)
echo "Direct dependencies: $DIRECT_DEPS"
echo "Total dependencies: $TOTAL_DEPS"
echo "Dependency ratio: $(echo "scale=2; $TOTAL_DEPS / $DIRECT_DEPS" | bc)"

# Package size analysis
echo ""
echo "💾 Size analysis:"
bun pm ls --size | tail -5
```

---

## 🎯 **Best Practices**

### **📋 Enterprise Package Management**

1. **Regular Maintenance**: Schedule weekly package.json cleanup and validation
2. **Version Consistency**: Use semantic versioning with proper git tagging
3. **Security First**: Regular audits and careful trust management
4. **Performance Monitoring**: Track dependency count and cache sizes

### **⚡ Performance Optimization**

1. **Cache Management**: Regular cache cleanup for optimal performance
2. **Dependency Analysis**: Monitor dependency growth and optimize
3. **Binary Management**: Use local binaries for project-specific tools
4. **Lockfile Integrity**: Verify hashes and maintain clean lockfiles

### **🔒 Security Practices**

1. **Trust Management**: Review and audit trusted dependencies
2. **Regular Auditing**: Schedule frequent security audits
3. **Dependency Vetting**: Carefully review new dependencies
4. **Access Control**: Manage publishing permissions carefully

---

## 📞 **Related Documentation**

- **📦 Dependency Management**: [./01-dependency-management.md](./01-dependency-management.md)
- **🔗 Local Development Linking**: [./05-local-development-linking.md](./05-local-development-linking.md)
- **🏗️ Monorepo Workspaces**: [./04-monorepo-workspaces.md](./04-monorepo-workspaces.md)
- **🔒 Security Auditing**: [../13-security-auditing/README.md](../13-security-auditing/README.md)

---

*Package Manager Utilities v3.0 • Bun PM • Enterprise-Grade • Performance-Optimized • Security-First*
