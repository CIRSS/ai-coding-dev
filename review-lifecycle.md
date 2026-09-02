# Review lifecycle

The diagram below illustrates the states a file can be in with respect to review and how the state changes. `Reviewed` is where every file should be.

```mermaid
flowchart TD
    AB["<b>Absent</b><br/>no file on disk"]
    NR["❌ <b>Never reviewed</b><br/>no review recorded"]
    RV["👀 ✅ 🔬 <b>Reviewed</b><br/>unchanged since last review"]
    CH["⚠️ <b>Unreviewed changes</b><br/>changed since last review"]

    AB -->|"create-never-reviewed"| NR
    AB -->|"restore-reviewed"| RV
    AB -->|"restore-changed"| CH
    NR -->|"review-never-reviewed"| RV
    RV -->|"edit-reviewed"| CH
    CH -->|"review-changed"| RV
    CH -->|"revert-changed"| RV
    NR -->|"delete-never-reviewed"| AB
    RV -->|"delete-reviewed"| AB
    CH -->|"delete-changed"| AB

    style AB fill:#ececec,stroke:#9e9e9e,color:#333333
    style NR fill:#fadcdc,stroke:#c62828,color:#4a1616
    style RV fill:#d7f0d7,stroke:#2e7d32,color:#1b3a1b
    style CH fill:#fdf0d0,stroke:#b8860b,color:#4a3a10
```

## How changes in review status are reflected in the report

The report excerpts below reflect the changing status of one file, `greeting.txt`, over three transitions in the state diagram.

The file starts with no review recorded (state = *Never reviewed*):

```
        ❌     greeting.txt
```

A careful review is recorded (transition via **`review-never-reviewed`** to state *Reviewed*):

```
     👀 ✅     greeting.txt   A Person, 2026-09-02  unchanged since bce72d7
```

A line is added, with no new review yet recorded (transition via **`edit-reviewed`** to state *Unreviewed changes*):

```
        ⚠️     greeting.txt   A Person, 2026-09-02  +1 −0 since bce72d7
```

The line is taken back out (transition via **`revert-changed`** to state *Reviewed*):

```
     👀 ✅     greeting.txt   A Person, 2026-09-02  unchanged since bce72d7
```


See [`README.md`](README.md) for the commands, what each icon means, and how a formal review names the artifact that records it.
