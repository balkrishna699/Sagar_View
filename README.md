# Sagar_View
A web based 3D data visualizer for scientific data stored in the NETCDF Files 
A project for our hackathon team SIH 2026
# Ocean Data Ingestion and Normalization Layer

This repository contains the data ingestion, parsing, normalization,
and prototype 3D data layer for the SIH ocean-data visualization project.

The purpose of this component is to convert heterogeneous ocean datasets
into a common `OceanDataset` representation that can be consumed by
backend services, AI systems, databases, and visualization applications.

---

## Architecture


                     ┌──────────────────────┐
                     │     OceanDataset     │
                     │   Common Data Model  │
                     └───────────▲──────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
       ┌──────┴──────┐   ┌──────┴──────┐   ┌──────┴──────┐
       │ NetCDFParser│   │ ArgoParser   │   │ ASCIIParser │
       └──────▲──────┘   └──────▲──────┘   └──────▲──────┘
              │                 │                  │
        INCOIS HYCOM       Argo NetCDF         CSV / ASCII
              │
              │
       ┌──────┴──────────────────────┐
       │ SyntheticDeepOceanParser    │
       └──────────────▲───────────────┘
                      │
              Synthetic 0–5000 m
                prototype data
                      │
                      ▼
             Backend / AI / Database
                      │
                      ▼
                Visualization