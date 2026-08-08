# eNVM-IMC-Modeling
This repository contains the code for our paper titled ["Energy-Accuracy Trade-offs for Resistive In-Memory Computing Architectures"](https://ieeexplore.ieee.org/abstract/document/10478888) by Saion K. Roy and Naresh R. Shanbhag, published in JxCDC 2024. The code captures the behavioral model of the analog non-idealities in resistive IMCs, thereby enabling us to analyze the SNDR dependence on various device, circuit, and architecture parameters and the fundamental energy-SNDR trade-off.

## Interactive website
Explore the device-agnostic parallel-bar design method, four-constraint high-SNDR workflow, multi-bank architecture builder, and measured case study at [calmyor.github.io/eNVM-IMC-Modeling](https://calmyor.github.io/eNVM-IMC-Modeling/).

## About
Resistive in-memory computing (IMC) architectures currently lag behind SRAM IMCs and digital accelerators in both energy efficiency and compute density due to their low compute accuracy. This paper proposes the use of signal-to-noise-plus-distortion ratio (SNDR) to quantify the compute accuracy of IMCs and identify the device, circuit, and architectural parameters that affect it. We further analyze the fundamental limits on the SNDR of MRAM, ReRAM, and FeFET-based IMCs employing parameter variation and noise models that were validated against measured results from a recent MRAM- based IMC prototype in a 22 nm process. At high output signal magnitude, we find that the maximum achievable SNDR is limited by the pre-ADC array non-idealities such as the conductance variations, parasitic resistances, and current mirror mismatch, whereas the ADC thermal noise limits the SNDR at small signal magnitudes. Furthermore, for large dot-product (DP) dimensions (N > 50), the maximum achievable SNDR is highest for FeFET, followed by ReRAM, and then MRAM. Finally, the increase in conductance contrast (gon/goff) enhances the maximum achievable SNDR only until it reaches a value of approximately 12. ReRAMs and FeFETs demonstrate high energy efficiencies while achieving high SNDR, as their low conductance values lead to lower currents and lower noise due to wire parasitics. In all cases, across all three device types, DP dimension, ADC precision, and conductance contrast, the maximum achievable SNDR is found to be in the range of 18 dB-to-22 dB, barely meeting the minimum needed for achieving an inference accuracy close to an equivalent fixed-point digital architecture. Finally, we demonstrate a network-level accuracy of 84.5 % when mapping a ResNet-20 (CIFAR-10) by ReRAM- based architecture at a SNDR of 22dB, which MRAM and FeFET-based architectures cannot realize. This result clearly implies the need for other approaches, e.g., algorithmic and learning-based methods, to improve the inference accuracy of resistive IMC architectures.

## Usage
The subfolders in SNDR-sim contain the codes that generate the plots in the main paper. The plotting data is generated from the .py files in MRAM, ReRAM, and FeFET folders.

## Environment
The following Python 3 packages are required to run the program
* numpy
* matplotlib

## Acknowledgements
This work was supported by the JUMP 2.0 Center for the Co-Design of Cognitive Systems (CoCoSys), funded by the Semiconductor Research Corporation (SRC) and the Defense Advanced Research Projects Agency (DARPA).
