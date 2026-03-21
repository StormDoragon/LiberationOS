# Agent System

## Overview

Agents are modular execution units responsible for specific tasks.

---

## Interface

```ts
execute(input, context) => output
```

---

## Core Agents

### Goal Interpreter

Parses user intent

### Planner

Creates workflow steps

### Content Pillar Agent

Defines content categories

### Hook Generator

Creates high-engagement hooks

### Script Writer

Generates content scripts

### Caption Writer

Creates platform-specific captions

### SEO Agent

Builds keyword clusters

### Article Writer

Generates long-form content

### Scheduler

Assigns publish times

### Publisher

Sends content to platforms

---

## Design Principles

- single responsibility
- composable
- testable
- schema-validated outputs

---

## Adding New Agent

1. Create agent file
2. implement interface
3. register in workflow engine
4. add prompt
5. define schema
