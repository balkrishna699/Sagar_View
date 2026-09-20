# Sagar_View
A web based 3D data visualizer for scientific data stored in the NETCDF Files 
A project for our hackathon team SIH 2026
# Ocean Data Parser

Parser and normalization layer for the ocean-data visualization prototype.

The purpose of this component is to handle different ocean-data formats and convert them into a common `OceanDataset` representation.

## Architecture


INCOIS NetCDF ──→ NetCDFParser ──┐
                                 │
Synthetic Argo ──→ ArgoParser ───┼──→ OceanDataset
                                 │
ASCII / CSV ────→ ASCIIParser ───┘
                                 │
                                 ▼
                         Visualization Layer