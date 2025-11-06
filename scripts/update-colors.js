#!/usr/bin/env node

/**
 * Color Update Script
 * 
 * This script updates all color classes in the codebase to use the new 4-color palette:
 * - buff: #E7A573
 * - keppel: #5AA197  
 * - seasalt: #FAFAFA
 * - gray: #7B7B7B
 * 
 * Usage: node scripts/update-colors.js
 */

const fs = require('fs');
const path = require('path');

// Color mapping from old colors to new 4-color palette
const colorMappings = {
  // Text colors - Standardize to gray-700 for consistency
  'text-gray-900': 'text-gray-700', 'text-gray-800': 'text-gray-700', 'text-gray-700': 'text-gray-700',
  'text-gray-600': 'text-gray-700', 'text-gray-500': 'text-gray-500', 'text-gray-400': 'text-gray-500',
  'text-slate-900': 'text-gray-700', 'text-slate-800': 'text-gray-700', 'text-slate-700': 'text-gray-700',
  'text-slate-600': 'text-gray-700', 'text-slate-500': 'text-gray-500', 'text-slate-400': 'text-gray-500',
  'text-blue-600': 'text-gray-700', 'text-blue-700': 'text-gray-700', 'text-blue-800': 'text-gray-700', 'text-blue-500': 'text-gray-700',
  'text-green-600': 'text-gray-700', 'text-green-700': 'text-gray-700',
  'text-red-600': 'text-gray-700', 'text-red-700': 'text-gray-700',
  'text-purple-600': 'text-gray-700', 'text-purple-700': 'text-gray-700',
  'text-indigo-600': 'text-gray-700', 'text-indigo-700': 'text-gray-700',
  // Old earth-tone colors to new 4-color palette
  'text-tea-green-500': 'text-gray-700', 'text-tea-green-600': 'text-gray-700', 'text-tea-green-700': 'text-gray-700',
  'text-beige-500': 'text-gray-700', 'text-beige-600': 'text-gray-700', 'text-beige-700': 'text-gray-700',
  'text-cornsilk-500': 'text-gray-700', 'text-cornsilk-600': 'text-gray-700', 'text-cornsilk-700': 'text-gray-700',
  'text-papaya-whip-500': 'text-gray-700', 'text-papaya-whip-600': 'text-gray-700', 'text-papaya-whip-700': 'text-gray-700',
  'text-buff-500': 'text-gray-700', 'text-buff-600': 'text-gray-700', 'text-buff-700': 'text-gray-700',
  // Background colors - Remove gradients, use solid colors
  'bg-gradient-tea-green': 'bg-keppel-500', 'bg-gradient-beige': 'bg-seasalt-500',
  'bg-gradient-cornsilk': 'bg-seasalt-500', 'bg-gradient-papaya-whip': 'bg-buff-500',
  'bg-gradient-buff': 'bg-buff-500', 'bg-gradient-multi': 'bg-keppel-500',
  'bg-tea-green-500': 'bg-keppel-500', 'bg-tea-green-600': 'bg-keppel-500', 'bg-tea-green-700': 'bg-keppel-500',
  'bg-beige-500': 'bg-seasalt-500', 'bg-beige-600': 'bg-seasalt-500', 'bg-beige-700': 'bg-seasalt-500',
  'bg-cornsilk-500': 'bg-seasalt-500', 'bg-cornsilk-600': 'bg-seasalt-500', 'bg-cornsilk-700': 'bg-seasalt-500',
  'bg-papaya-whip-500': 'bg-buff-500', 'bg-papaya-whip-600': 'bg-buff-500', 'bg-papaya-whip-700': 'bg-buff-500',
  'bg-buff-500': 'bg-buff-500', 'bg-buff-600': 'bg-buff-500', 'bg-buff-700': 'bg-buff-500',
  // Fix button text colors for better contrast
  'bg-keppel-500 text-gray-700': 'bg-keppel-500 text-seasalt-500',
  'bg-keppel-500 text-gray-600': 'bg-keppel-500 text-seasalt-500',
  'bg-keppel-500 text-gray-500': 'bg-keppel-500 text-seasalt-500',
  'bg-buff-500 text-gray-700': 'bg-buff-500 text-seasalt-500',
  'bg-buff-500 text-gray-600': 'bg-buff-500 text-seasalt-500',
  'bg-buff-500 text-gray-500': 'bg-buff-500 text-seasalt-500',
  // Border colors
  'border-tea-green-500': 'border-keppel-500', 'border-beige-500': 'border-seasalt-500',
  'border-cornsilk-500': 'border-seasalt-500', 'border-papaya-whip-500': 'border-buff-500',
  'border-buff-500': 'border-buff-500',
  // Focus ring colors
  'focus:ring-blue-500': 'focus:ring-keppel-500', 'focus:ring-green-500': 'focus:ring-keppel-500',
  'focus:ring-red-500': 'focus:ring-buff-500', 'focus:ring-purple-500': 'focus:ring-buff-500',
  'focus:ring-indigo-500': 'focus:ring-keppel-500',
  'focus:ring-tea-green-500': 'focus:ring-keppel-500', 'focus:ring-beige-500': 'focus:ring-seasalt-500',
  'focus:ring-cornsilk-500': 'focus:ring-seasalt-500', 'focus:ring-papaya-whip-500': 'focus:ring-buff-500',
  'focus:ring-buff-500': 'focus:ring-buff-500',
  // Loading spinner colors
  'border-blue-600': 'border-keppel-500', 'border-blue-500': 'border-keppel-500',
  'border-tea-green-500': 'border-keppel-500', 'border-beige-500': 'border-seasalt-500',
  'border-cornsilk-500': 'border-seasalt-500', 'border-papaya-whip-500': 'border-buff-500',
  'border-buff-500': 'border-buff-500',
  // Shadow colors
  'shadow-blue-500': 'shadow-keppel-500', 'shadow-green-500': 'shadow-keppel-500',
  'shadow-red-500': 'shadow-buff-500', 'shadow-purple-500': 'shadow-buff-500',
  'shadow-indigo-500': 'shadow-keppel-500',
};

// Directories to process
const directories = [
  'app',
  'components', 
  'lib',
  'styles'
];

// File extensions to process
const extensions = ['.tsx', '.ts', '.jsx', '.js', '.css'];

// Function to recursively find files
function findFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next directories
      if (!['node_modules', '.next', '.git'].includes(item)) {
        findFiles(fullPath, files);
      }
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to update colors in a file
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Apply color mappings
    for (const [oldColor, newColor] of Object.entries(colorMappings)) {
      const regex = new RegExp(`\\b${oldColor}\\b`, 'g');
      if (content.includes(oldColor)) {
        content = content.replace(regex, newColor);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('🎨 Starting color update process...\n');
  
  let totalFiles = 0;
  let updatedFiles = 0;
  
  // Process each directory
  for (const dir of directories) {
    if (fs.existsSync(dir)) {
      console.log(`📁 Processing directory: ${dir}`);
      const files = findFiles(dir);
      
      for (const file of files) {
        totalFiles++;
        if (updateFile(file)) {
          updatedFiles++;
        }
      }
    } else {
      console.log(`⚠️  Directory not found: ${dir}`);
    }
  }
  
  console.log(`\n🎉 Color update complete!`);
  console.log(`📊 Files processed: ${totalFiles}`);
  console.log(`✨ Files updated: ${updatedFiles}`);
  
  if (updatedFiles > 0) {
    console.log('\n💡 Next steps:');
    console.log('1. Check the /test-colors page to verify the new colors');
    console.log('2. Test the application to ensure everything looks correct');
    console.log('3. Commit the changes to version control');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { colorMappings, updateFile, findFiles };