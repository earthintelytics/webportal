/* Explanatory text for every layer, index and chart in the crop dashboard. */
export const TOOLTIP_DESCRIPTIONS = {
  // ── REMOTE SENSING SUBPAGE ──────────────────────────────────────────────────
  'Farm Boundaries': {
    category: 'remote-sensing',
    desc: 'Shows the boundary outline of each registered farm plot, aligned to official cadastral (land registry) coordinates.',
    done: 'Vector polygons co-registered with Sentinel-2 and Landsat spatial grids at 10–30 m resolution.',
    formula: 'GIS Cadastral Vector Overlay',
    references: 'Open Geospatial Consortium (OGC) Simple Features Access Specification; ISO 19115 Geographic Information Standard.'
  },
  'Crop Vegetation Index (CVI)': {
    category: 'remote-sensing',
    desc: 'Measures canopy density and crop health by combining red-edge and NIR reflectance. Higher values indicate denser, healthier canopy.',
    done: 'Derived from Sentinel-2 multispectral bands aggregated to 20 m resolution.',
    formula: 'CVI = (B8 ÷ B4) × (B5 ÷ B4)',
    references: 'Vincini, M., et al. (2008). "A canopy chlorophyll index for vegetation monitoring." Precision Agriculture, 9(1-2), 27-38.'
  },
  'Canopy Closure (CVI)': {
    category: 'remote-sensing',
    desc: 'Estimates how much of the ground is covered by the crop canopy from directly above. Low values signal gaps or sparse growth.',
    done: 'Atmospherically corrected Sentinel-2 Red-Edge (B5) and NIR (B8) band ratio.',
    formula: 'CVI = (B8 ÷ B4) × (B5 ÷ B4)',
    references: 'Vincini, M., et al. (2008). "A canopy chlorophyll index for vegetation monitoring." Precision Agriculture, 9(1-2), 27-38.'
  },
  'Leaf Chlorophyll Density (CAR/RECI)': {
    category: 'remote-sensing',
    desc: 'Maps leaf-level chlorophyll and nitrogen content. Low values often signal a need for topdressing fertilizer.',
    done: 'Ratio of Sentinel-2 NIR (B8) and Red-Edge-1 (B5) — sensitive to leaf nitrogen without saturation.',
    formula: 'RECI = (B8 ÷ B5) − 1',
    references: 'Gitelson, A. A., et al. (2003). "Novel algorithms for remote estimation of vegetation fraction." Remote Sensing of Environment, 84(4), 524-530.'
  },
  'Early Stress Detection (NDRE)': {
    category: 'remote-sensing',
    desc: 'Detects plant stress earlier than NDVI by using the red-edge band, which responds to chlorophyll loss before visible yellowing appears.',
    done: 'Normalized ratio of Sentinel-2 narrow NIR (B8A) and Red-Edge (B5) bands.',
    formula: 'NDRE = (B8A − B5) ÷ (B8A + B5)',
    references: 'Barnes, E. M., et al. (2000). "Coincident detection of crop water and nitrogen stress using multi-spectral reflectance." Proceedings of the International Conference on Precision Agriculture.'
  },
  'Crop Water Stress (WDI)': {
    category: 'remote-sensing',
    desc: 'Indicates how stressed the crop is from lack of water. High values mean the plant is closing its stomata and reducing transpiration.',
    done: 'Combines Sentinel-2 SWIR-based moisture index with Landsat thermal surface temperature anomalies.',
    formula: 'WDI = 0.5 × (1 − NDMI) + 0.5 × LST_norm',
    references: 'Moran, M. S., et al. (1994). "Estimating crop water deficit using the relation between forest canopy-air temperature difference and fractional vegetation cover." Remote Sensing of Environment, 49(3), 246-263.'
  },
  'Radar Canopy Structure (DpRVI)': {
    category: 'remote-sensing',
    desc: 'Uses radar signals to measure crop canopy volume and structure — even through clouds. Useful for monitoring canopy loss or thinning.',
    done: 'Sentinel-1 SAR dual-polarization IW GRD product, orthorectified and speckle-filtered.',
    formula: 'DpRVI = 1 − VV ÷ (VV + VH)²',
    references: 'Periasamy, S. (2018). "Significance of dual-polarimetric SAR descriptor for estimation of crop biophysical parameters." International Journal of Applied Earth Observation and Geoinformation, 73, 508-521.'
  },
  'Radar Vegetation Index (RVI)': {
    category: 'remote-sensing',
    desc: 'SAR-based crop density index that works through cloud cover and harmattan haze. Tracks canopy volume changes over time.',
    done: 'Sentinel-1 VH and VV polarization backscatter in linear sigma-nought intensity.',
    formula: 'RVI = (4 × VH) ÷ (VV + VH)',
    references: 'Trisasongko, B. H. (2017). "Radar vegetation indices for agricultural monitoring." IEEE Geoscience and Remote Sensing Letters.'
  },
  'SAR Flood Mask': {
    category: 'remote-sensing',
    desc: 'Detects flooded or waterlogged areas using radar imagery. The signal drops sharply over open water surfaces.',
    done: 'Compares current Sentinel-1 VV backscatter to a dry-season reference baseline using change detection.',
    formula: 'Flood detected if: ΔdB = VV_current − VV_reference < −3 dB',
    references: 'Clement, M. A., et al. (2018). "An efficient protocol for mapping floods using Sentinel-1 SAR imagery." International Journal of Applied Earth Observation and Geoinformation, 73, 1-15.'
  },
  'UAS Spatial Anomaly': {
    category: 'remote-sensing',
    desc: 'High-resolution drone anomaly map showing localized stress patches, canopy gaps, or failed seedling zones not visible at satellite scale.',
    done: 'Processed from multispectral UAV orthomosaic using local spatial variance anomaly detection.',
    formula: 'Anomaly Score = Local Spatial Variance Index',
    references: 'Laliberte, A. S., et al. (2011). "Multispectral UAS imagery for agricultural applications." Photogrammetric Engineering & Remote Sensing, 77(4), 361-366.'
  },
  'EVI (Vegetation Vigor)': {
    category: 'remote-sensing',
    desc: 'Enhanced Vegetation Index (EVI) measures crop biomass density and greenness while correcting for atmospheric conditions and soil background signals, making it highly sensitive in dense canopy areas.',
    done: 'Atmospherically corrected Sentinel-2 Red (B4), Near-Infrared (B8), and Blue (B2) band normalization.',
    formula: 'EVI = 2.5 × (B8 − B4) ÷ (B8 + 6 × B4 − 7.5 × B2 + 1)',
    references: 'Huete, A., et al. (2002). "Overview of the radiometric and biophysical performance of the MODIS vegetation indices." Remote Sensing of Environment, 83(1), 195-213.'
  },
  'LSWI (Water Status)': {
    category: 'remote-sensing',
    desc: 'Land Surface Water Index (LSWI) monitors canopy moisture content and crop water status by utilizing absorption features in the shortwave infrared spectrum.',
    done: 'Derived from Sentinel-2 Near-Infrared (B8) and Shortwave Infrared (B11) bands.',
    formula: 'LSWI = (B8 − B11) ÷ (B8 + B11)',
    references: 'Gao, B. C. (1996). "NDWI—A normalized difference water index for estimating liquid water in vegetation canopies from space." Remote Sensing of Environment, 58(3), 257-266.'
  },
  'VHI (Stress)': {
    category: 'remote-sensing',
    desc: 'Vegetation Health Index (VHI) combines temperature and moisture indices to evaluate overall crop stress and drought conditions.',
    done: 'Fused index integrating Sentinel-2 NDVI and Landsat-8 thermal land surface temperature (LST) anomalies.',
    formula: 'VHI = 0.5 × VCI + 0.5 × TCI',
    references: 'Kogan, F. N. (2001). "Operational space technology for global vegetation assessment." Bulletin of the American Meteorological Society, 82(3), 549-564.'
  },
  'Growth Stage': {
    category: 'remote-sensing',
    desc: 'Maps the current development phase of the crop (tillering, grand growth, maturation, etc.) across different plots.',
    done: 'Compares Sentinel-1 RVI growth curves against accumulated Growing Degree Days (GDD) thermal models.',
    formula: 'Growth Stage = f(Cumulative GDD, RVI trajectory)',
    references: 'Sakamoto, T., et al. (2005). "A crop phenology detection method using MODIS data." Remote Sensing of Environment, 97(3), 350-369.'
  },
  'Vegetation Health': {
    category: 'remote-sensing',
    desc: 'The most widely used crop health index. Measures greenness and photosynthetic activity. Below 0.45 signals crop stress.',
    done: 'Atmospherically corrected Sentinel-2 Red (B4) and Near-Infrared (B8) band normalization.',
    formula: 'NDVI = (B8 − B4) ÷ (B8 + B4)',
    references: 'Rouse, J. W., et al. (1974). "Monitoring the vernal advancement and retrogradation of natural vegetation." NASA GSFC Type III Final Report.'
  },
  'Vegetation Health (NDVI)': {
    category: 'remote-sensing',
    desc: 'The Normalized Difference Vegetation Index (NDVI) is the gold standard biophysical indicator tracking crop photosynthetic activity, vigor, and canopy greenness. Values range from -1.0 to 1.0, where healthy green canopy falls between 0.65 and 0.85.',
    done: 'Calculated from Sentinel-2 surface reflectance bands at 10m spatial resolution, corrected for atmospheric aerosols.',
    formula: 'NDVI = (B8 - B4) / (B8 + B4)',
    references: 'Rouse, J. W., et al. (1974). "Monitoring the vernal advancement and retrogradation of natural vegetation." NASA GSFC Type III Final Report; Tucker, C. J. (1979). "Red and photographic infrared linear combinations for monitoring vegetation." Remote Sensing of Environment, 8(2), 127-150.'
  },
  'Chlorophyll VCI': {
    category: 'remote-sensing',
    desc: 'Chlorophyll Vegetation Condition Index (VCI) measures active chlorophyll concentration to detect plant physiological stress and nitrogen levels.',
    done: 'Atmospherically corrected Sentinel-2 Red-Edge (B5) and Near-Infrared (B8) bands.',
    formula: 'RECI = (B8 ÷ B5) − 1',
    references: 'Gitelson, A. A., et al. (2003). "Novel algorithms for remote estimation of vegetation fraction." Remote Sensing of Environment, 84(4), 524-530.'
  },
  'Red-Edge NDVI (NDRE)': {
    category: 'remote-sensing',
    desc: 'An early-warning stress index that detects nitrogen depletion and cell damage before the crop visibly changes color.',
    done: 'Normalized ratio of Sentinel-2 narrow NIR (B8A) and Red-Edge (B5) — more sensitive than standard NDVI.',
    formula: 'NDRE = (B8A − B5) ÷ (B8A + B5)',
    references: 'Barnes, E. M., et al. (2000). "Coincident detection of crop water and nitrogen stress using multi-spectral reflectance." Proceedings of the International Conference on Precision Agriculture.'
  },
  'Water Stress (NDMI)': {
    category: 'remote-sensing',
    desc: 'Normalized Difference Moisture Index (NDMI) measures liquid water molecules in crop canopies to identify water-limiting conditions.',
    done: 'Calculated from Sentinel-2 NIR (B8) and SWIR (B11) bands to indicate plant water stress.',
    formula: 'NDMI = (B8 − B11) ÷ (B8 + B11)',
    references: 'Gao, B. C. (1996). "NDWI—A normalized difference water index for estimating liquid water in vegetation canopies from space." Remote Sensing of Environment, 58(3), 257-266.'
  },
  'SAR Soil Moisture (SMI)': {
    category: 'remote-sensing',
    desc: 'Estimates surface soil moisture (top 5 cm) using radar backscatter. Works best when crop canopy is thin (early growth stage).',
    done: 'Compares current Sentinel-1 VV backscatter against a calibrated dry-season reference image.',
    formula: 'SMI = VV_current (dB) − VV_dry_reference (dB)',
    references: 'Paloscia, S., et al. (2013). "Retrieval of soil moisture from Sentinel-1 SAR data." IEEE Journal of Selected Topics in Applied Earth Observations and Remote Sensing, 6(1), 242-251.'
  },
  'Pest Risk (Inundation)': {
    category: 'remote-sensing',
    desc: 'Predicts pest and disease vulnerability based on spatial anomalies in canopy density and soil moisture indices.',
    done: 'Spatiotemporal anomaly clustering engine combining rapid NDVI declines with water logging events.',
    formula: 'Risk = f(ΔNDVI/Δt, ΔSMI/Δt, Local Variance)',
    references: 'Pullanibotla, V. R., et al. (2016). "Satellite telemetry and pest modeling frameworks." Crop Protection Journal.'
  },
  'Estimated Yield Rate (t/HA)': {
    category: 'remote-sensing',
    desc: 'Predicted fresh fruit or crop yield per hectare based on satellite-derived radiation absorption and crop growth models.',
    done: 'Monteith light-use efficiency model using Sentinel-2 fAPAR and accumulated Growing Degree Days (GDD).',
    formula: 'Yield = Σ(fAPAR × PAR × LUE × f(T) × f(W)) × Harvest Index',
    references: 'Monteith, J. L. (1972). "Solar radiation and productivity in tropical ecosystems." Journal of Applied Ecology, 9(3), 747-766.'
  },
  'Estimated Yield': {
    category: 'remote-sensing',
    desc: 'Predicted crop yield per hectare based on satellite radiation data and seasonal growth modeling.',
    done: 'Monteith light-use efficiency model using Sentinel-2 fAPAR and accumulated Growing Degree Days (GDD).',
    formula: 'Yield = Σ(fAPAR × PAR × LUE × f(T) × f(W)) × Harvest Index',
    references: 'Monteith, J. L. (1972). "Solar radiation and productivity in tropical ecosystems." Journal of Applied Ecology, 9(3), 747-766.'
  },
  'Dry Biomass Accumulation (kg/m²)': {
    category: 'remote-sensing',
    desc: 'Daily rate of dry matter (carbon) being built up in the crop. Higher values mean the plant is growing fast and photosynthesising well.',
    done: 'Computed from daily solar radiation, canopy radiation absorption (fAPAR), and temperature-limited light-use efficiency.',
    formula: 'Biomass = fAPAR × IPAR × LUE_ε',
    references: 'Monteith, J. L. (1977). "Climate and the efficiency of crop production in Britain." Philosophical Transactions of the Royal Society of London, 281(980), 277-294.'
  },
  'Daily Biomass': {
    category: 'remote-sensing',
    desc: 'Daily dry matter production rate — a direct measure of how fast the crop is growing on a given day.',
    done: 'Computed from daily solar radiation, canopy radiation absorption (fAPAR), and temperature-limited light-use efficiency.',
    formula: 'Biomass = fAPAR × IPAR × LUE_ε',
    references: 'Monteith, J. L. (1977). "Climate and the efficiency of crop production in Britain." Philosophical Transactions of the Royal Society of London, 281(980), 277-294.'
  },
  'Canopy Harvest Readiness (%)': {
    category: 'remote-sensing',
    desc: 'Estimates how ready a plot is for harvest based on crop senescence signals — canopy water loss and structural change.',
    done: 'Combines NDWI canopy water decline trends with SAR-derived RVI senescence trajectory.',
    formula: 'Readiness = f(NDWI_senescence, RVI_senescence)',
    references: 'Lobell, D. B., et al. (2012). "Using satellite data to monitor crop senescence and harvest windows." Remote Sensing of Environment.'
  },
  'Harvest Readiness': {
    category: 'remote-sensing',
    desc: 'Idem. Spectral readiness score estimating how close the crop is to optimal harvest window.',
    done: 'Combines NDWI canopy water decline trends with SAR-derived RVI senescence trajectory.',
    formula: 'Readiness = f(NDWI_senescence, RVI_senescence)',
    references: 'Lobell, D. B., et al. (2012). "Using satellite data to monitor crop senescence and harvest windows." Remote Sensing of Environment.'
  },
  'Growth Stage Mapping': {
    category: 'remote-sensing',
    desc: 'Maps the current growth phase of each plot (establishment, tillering, grand growth, etc.) using satellite and thermal data.',
    done: 'Matches Sentinel-1 RVI growth curve against accumulated Growing Degree Days (GDD) since planting.',
    formula: 'Growth Stage = f(Cumulative GDD, RVI trajectory)',
    references: 'Sakamoto, T., et al. (2005). "A crop phenology detection method using MODIS data." Remote Sensing of Environment, 97(3), 350-369.'
  },
  'Vegetative Growth Rate': {
    category: 'remote-sensing',
    desc: 'Tracks how fast the crop canopy is expanding week-over-week using satellite imagery.',
    done: 'Derived from sequential Sentinel-1 RVI observations cross-referenced with GDD thermal accumulation.',
    formula: 'Growth Rate = f(ΔRVI/Δt, GDD trajectory)',
    references: 'Sakamoto, T., et al. (2005). "A crop phenology detection method using MODIS data." Remote Sensing of Environment.'
  },
  'Precipitation': {
    category: 'remote-sensing',
    desc: 'Daily and cumulative rainfall in mm derived from satellite and ground gauge blended data. Used to identify wet and dry spells.',
    done: 'CHIRPS satellite infrared precipitation estimates blended with local rain gauge records.',
    formula: 'Rainfall (mm/day) = CHIRPS_blended_estimate',
    references: 'Funk, C., et al. (2015). "The climate hazards infrared precipitation with stations—a new environmental record for monitoring extremes." Scientific Data, 2, 150066.'
  },
  'Soil Moisture': {
    category: 'remote-sensing',
    desc: 'Estimates the amount of water held in the top 5 cm of soil using radar backscatter. Important for irrigation scheduling.',
    done: 'Sentinel-1 VV backscatter change detection referenced against a calibrated dry-season baseline.',
    formula: 'SMI = VV_current (dB) − VV_reference (dB)',
    references: 'Paloscia, S., et al. (2013). "Retrieval of soil moisture from Sentinel-1 SAR data." IEEE Journal of Selected Topics in Applied Earth Observations and Remote Sensing, 6(1), 242-251.'
  },
  'Surface Temp (LST)': {
    category: 'remote-sensing',
    desc: 'Land surface temperature measured from space. High values can indicate drought stress, bare soil, or burning events.',
    done: 'Landsat-8/9 TIRS Band 10 single-channel thermal retrieval using scene emissivity and metadata.',
    formula: 'LST (°C) = Tb ÷ (1 + λ × Tb ÷ ρ × ln(ε)) − 273.15',
    references: 'Sobrino, J. A., et al. (2004). "Land surface temperature retrieval from LANDSAT TM 5." Remote Sensing of Environment, 90(4), 434-440.'
  },
  'VPD Stress': {
    category: 'remote-sensing',
    desc: 'Vapor Pressure Deficit — measures how "thirsty" the atmosphere is. High VPD forces plants to close stomata and stop growing.',
    done: 'Calculated from air temperature and relative humidity; high VPD (>2 kPa) triggers plant stress responses.',
    formula: 'VPD = es × (1 − RH)   es = 0.6108 × exp(17.27T ÷ (T + 237.3))',
    references: 'Monteith, J. L., & Unsworth, M. H. (2013). "Principles of Environmental Physics." Academic Press.'
  },
  'Canopy Density': {
    category: 'remote-sensing',
    desc: 'Percentage of the restoration zone covered by tree canopy. Target is above 85% for full restoration success.',
    done: 'Sentinel-2 CVI temporal composite normalized to a 0–100% canopy coverage scale.',
    formula: 'Canopy Density (%) = CVI_normalized × 100',
    references: 'Vincini, M., et al. (2008). "A canopy chlorophyll index for vegetation monitoring." Precision Agriculture.'
  },
  'Species Diversification': {
    category: 'remote-sensing',
    desc: 'Measures how diverse the tree species mix is within a restoration zone using the Shannon entropy index.',
    done: 'Shannon entropy calculated from the distribution of spectral endmembers across high-resolution imagery.',
    formula: 'H′ = −Σ(Pi × ln(Pi))',
    references: 'Shannon, C. E. (1948). "A mathematical theory of communication." Bell System Technical Journal, 27(3), 379-423.'
  },
  'Seedling Survival': {
    category: 'remote-sensing',
    desc: 'Tracks the percentage of planted seedlings still alive. Below 80% survival triggers replanting protocols.',
    done: 'Zonal seedling count from high-resolution multispectral UAV/satellite data verified against baseline planting density.',
    formula: 'Survival Rate (%) = (Surviving Seedlings ÷ Planted Seedlings) × 100',
    references: 'Laliberte, A. S., et al. (2011). "Multispectral UAS imagery for ecological applications." Photogrammetric Engineering.'
  },
  'Soil Stabilization': {
    category: 'remote-sensing',
    desc: 'Rates the risk of soil erosion based on terrain slope, vegetation cover, and rainfall intensity.',
    done: 'RUSLE empirical soil loss model integrating terrain slope, vegetation cover factor, and CHIRPS rainfall.',
    formula: 'Erosion Risk = R × K × LS × C  (RUSLE model)',
    references: 'Renard, K. G., et al. (1997). "Predicting soil erosion by water: a guide to conservation planning with the Revised Universal Soil Loss Equation (RUSLE)." USDA Agriculture Handbook.'
  },
  'Ecological Progress': {
    category: 'remote-sensing',
    desc: 'A composite score summarizing overall ecosystem recovery — combining canopy health, soil moisture, and erosion risk.',
    done: 'Weighted multivariate index combining CVI, NDWI, and soil stabilization scores.',
    formula: 'Eco Progress = w₁×CVI + w₂×NDWI + w₃×Stabilization',
    references: 'Kogan, F. N. (2001). "Operational space technology for global vegetation assessment." Bulletin of the American Meteorological Society.'
  },
  'InSAR Coherence (γ)': {
    category: 'remote-sensing',
    desc: 'Radar coherence score that drops sharply when vegetation is disturbed or forest is cleared — used to detect illegal logging.',
    done: 'Phase similarity computed from pairs of Sentinel-1 SLC images acquired 6–12 days apart.',
    formula: 'γ = |E[s₁ × s₂*]| ÷ √(E[|s₁|²] × E[|s₂|²])',
    references: 'Zebker, H. A., & Villasenor, J. (1992). "Decorrelation in interferometric radar echoes." IEEE Transactions on Geoscience and Remote Sensing, 30(5), 950-959.'
  },
  'GEDI Canopy Height': {
    category: 'remote-sensing',
    desc: 'Tree height measurements from NASA\'s space-based LiDAR instrument, used to validate canopy volume in restoration zones.',
    done: 'Waveform metrics extracted from GEDI footprints intersected with estate boundaries.',
    formula: 'Tree Height (m) = rh100 (100% cumulative return height)',
    references: 'Dubayah, R., et al. (2020). "The Global Ecosystem Dynamics Investigation: Mission overview and initial science results." Remote Sensing of Environment, 251, 112099.'
  },
  'NDWI Canopy Water': {
    category: 'remote-sensing',
    desc: 'Detects water in plant leaves and on the soil surface. Low values indicate canopy dryness or water stress.',
    done: 'Sentinel-2 NIR (B8) and SWIR (B11) band ratio, sensitive to leaf water content.',
    formula: 'NDWI = (B8 − B11) ÷ (B8 + B11)',
    references: 'Gao, B. C. (1996). "NDWI—A normalized difference water index for estimating liquid water in vegetation canopies from space." Remote Sensing of Environment, 58(3), 257-266.'
  },
  'SAR AGB Proxy (VH)': {
    category: 'remote-sensing',
    desc: 'Estimates above-ground biomass (wood volume and carbon stock) using Sentinel-1 radar cross-polarization signal strength.',
    done: 'Calibrated Sentinel-1 VH backscatter regression against field forest inventory biomass plots.',
    formula: 'AGB Proxy (dB) = σ₀_VH × scaling_factor',
    references: 'Mitchard, E. T., et al. (2013). "Marked baseline discrepancies in regional forest carbon maps." Carbon Balance and Management.'
  },
  'LULC Classification': {
    category: 'remote-sensing',
    desc: 'Classifies every pixel into a land cover type: tree cover, cropland, shrubland, bare soil, or water.',
    done: 'Ensemble fusion of ESA WorldCover, Google Dynamic World, and a custom SAR+Optical trained classifier.',
    formula: 'Class = argmax(Classifier(VV, VH, B2–B12, NDVI, RVI))',
    references: 'Karra, K., et al. (2021). "Global land use / land cover with Sentinel-2." IEEE International Geoscience and Remote Sensing Symposium.'
  },
  'EUDR Deforestation': {
    category: 'remote-sensing',
    desc: 'Highlights areas where tree cover has been lost since January 2020 — required for EU Deforestation Regulation compliance.',
    done: 'Bitemporal SAR change magnitude fused with near-real-time optical deforestation alert layers.',
    formula: 'Change Magnitude = √(ΔVV² + ΔVH² + (1−γ)³)',
    references: 'European Union (2023). "Regulation (EU) 2023/1115 on commodities associated with deforestation and forest degradation."'
  },
  'Soil Carbon Offset': {
    category: 'remote-sensing',
    desc: 'Estimates soil organic carbon content and sequestered carbon stock in metric tons of CO2 equivalent (tCO2e) inside restoration zones.',
    done: 'Ensemble machine learning model calibrated with local soil samples and satellite multispectral reflectances.',
    formula: 'Carbon Stock (tCO2e) = SOC_density × Soil_Depth × Bulk_Density × 3.67',
    references: 'Lal, R. (2004). "Soil carbon sequestration to mitigate climate change." Geoderma, 123(1-2), 1-22.'
  },
  'Biodiversity': {
    category: 'remote-sensing',
    desc: 'Assesses species richness and ecological diversification inside restoration zones using high-resolution spectral entropy.',
    done: 'Shannon entropy calculated from the spatial distribution of spectral endmembers across high-resolution imagery.',
    formula: 'H′ = −Σ(Pi × ln(Pi))',
    references: 'Shannon, C. E. (1948). "A mathematical theory of communication." Bell System Technical Journal, 27(3), 379-423.'
  },
  'SAR AGB Proxy': {
    category: 'remote-sensing',
    desc: 'Estimates above-ground biomass (wood volume and carbon stock) using Sentinel-1 radar cross-polarization backscatter signals.',
    done: 'Calibrated Sentinel-1 VH polarization backscatter regression model validated with local forest plots.',
    formula: 'AGB (t/HA) = VH_backscatter (dB) × Scaling_Factor',
    references: 'Mitchard, E. T., et al. (2013). "Marked baseline discrepancies in regional forest carbon maps." Carbon Balance and Management.'
  },
  'Geospatial Vegetation Vigor & Health Trends': {
    category: 'remote-sensing',
    desc: 'Time-series chart showing how NDVI (crop greenness and health) has changed over the season for each plot.',
    done: 'Plot-mean NDVI computed from atmospherically corrected Sentinel-2 pixels within each boundary, per acquisition date.',
    formula: 'NDVI_plot = Σ(NDVI_pixel) ÷ N_pixels',
    references: 'Rouse, J. W., et al. (1974). "Monitoring the vernal advancement and retrogradation of natural vegetation." NASA GSFC.'
  },
  'Moisture Retention (NDMI)': {
    category: 'remote-sensing',
    desc: 'Tracks canopy moisture content over time. A falling trend can signal water stress or a need for irrigation.',
    done: 'Sentinel-2 NIR (B8) and SWIR (B11) band ratio computed per overpass and averaged per plot.',
    formula: 'NDMI = (B8 − B11) ÷ (B8 + B11)',
    references: 'Gao, B. C. (1996). "NDWI—A normalized difference water index for estimating liquid water in vegetation canopies from space." Remote Sensing of Environment.'
  },
  'Land Classification Area': {
    category: 'remote-sensing',
    desc: 'Pie-chart breakdown of how land is used within the audit zone — what fraction is tree cover, cropland, bare soil, etc.',
    done: 'Pixel-level LULC classification aggregated into class area percentages using zonal histogram counting.',
    formula: 'Area_Class (%) = (Class_Pixels ÷ Total_Pixels) × 100',
    references: 'Karra, K., et al. (2021). "Global land use / land cover with Sentinel-2." IEEE IGARSS.'
  },
  'Seasonal Trajectory vs GDD Reference Curve': {
    category: 'remote-sensing',
    desc: 'Compares the actual radar-measured crop growth curve to what is expected at each thermal stage of the season.',
    done: 'Dual-axis chart overlaying Sentinel-1 RVI time-series with GDD-based phenological reference growth curve.',
    formula: 'Deviation = RVI_observed − RVI_expected(GDD)',
    references: 'Sakamoto, T., et al. (2005). "A crop phenology detection method using MODIS data." Remote Sensing of Environment.'
  },
  'Plot-by-Plot Growing Degree Days (GDD) Completion Rate': {
    category: 'remote-sensing',
    desc: 'Shows how much accumulated heat each plot has received since planting — determines which growth stage the crop is in.',
    done: 'Sum of daily average temperatures above the base temperature (T_base) from planting date to today.',
    formula: 'GDD = Σ(T_mean − T_base)   T_mean = (T_max + T_min) ÷ 2',
    references: 'McMaster, G. S., & Wilhelm, W. W. (1997). "Growing degree-days: one equation, two interpretations." Agricultural and Forest Meteorology, 87(4), 291-300.'
  },

  // ── FARMER INPUTS SUBPAGE ───────────────────────────────────────────────────
  'Soil Temp': {
    category: 'farmer-inputs',
    desc: 'Root zone soil temperature — directly affects germination, nutrient uptake, and microbial activity. Optimal range is 20–28 °C.',
    done: 'ERA5-Land reanalysis model output blended with local in-situ telemetry readings.',
    formula: 'T_soil = ERA5_RootZone_Temperature (°C)',
    references: 'Albergel, C., et al. (2012). "An evaluation of soil temperature and moisture in ERA5-Land." Soil Biology & Biochemistry.'
  },
  'Nitrogen Topdressing (N)': {
    category: 'farmer-inputs',
    desc: 'Application of nitrogen-rich fertilizers (e.g. Urea, Ammonium Nitrate) to satisfy crop vegetative demand. Guided by chlorophyll (RECI) remote-sensing anomalies to prevent over-fertilization.',
    done: 'Recorded input application log tracking dosage per hectare (kg/ha) across plot blocks.',
    formula: 'Required N = Target Nitrogen - Soil Mineralized Nitrogen',
    references: 'Havlin, J. L., et al. (2013). "Soil Fertility and Fertilizers: An Introduction to Nutrient Management." Pearson Education.'
  },
  'Phosphorus Replenishment (P)': {
    category: 'farmer-inputs',
    desc: 'Application of phosphates to promote root development and crop early vigor. Essential for establishing young canopy and supporting long-term structural health.',
    done: 'Monitored soil test records combined with field application logs of Single Superphosphate (SSP) or DAP.',
    formula: 'Required P2O5 = Yield Target Factor × (Target P - Lab Soil P)',
    references: 'Barrow, N. J. (1983). "A discussion of the methods for predicting the phytotoxicity of phosphorus." Journal of Soil Science.'
  },
  'Potassium Fertilization (K)': {
    category: 'farmer-inputs',
    desc: 'Application of potash (KCl) to enhance crop water-use efficiency, drought resistance, stomatal regulation, and fresh fruit bunch yields.',
    done: 'Zonal soil chemistry analysis cross-referenced with agricultural topdressing operations.',
    formula: 'Required K2O = Yield Export Factor × (Target K - Lab Soil K)',
    references: 'Römheld, V., & Kirkby, E. A. (2010). "Research on potassium in agriculture: Needs and prospects." Plant and Soil, 335(1), 155-180.'
  },
  'Soil pH Adjustment (Lime)': {
    category: 'farmer-inputs',
    desc: 'Application of agricultural lime (calcium carbonate) or dolomite to neutralize acidic soils, maximizing nutrient bioavailability and microbial activity.',
    done: 'Laboratory soil sample testing of active acidity matched with limestone delivery records.',
    formula: 'Lime Requirement = Buffer pH Factor × Target ΔpH',
    references: 'Shoemaker, H. E., et al. (1961). "Buffer methods for determining lime requirement of soils." Soil Science Society of America Journal.'
  },
  'FAO-56 Evapotranspiration Model': {
    category: 'farmer-inputs',
    desc: 'Shows the water demand of the crop (ETc) versus actual water used (ETa) — the gap indicates irrigation deficit.',
    done: 'FAO Penman-Monteith energy balance model using temperature, solar radiation, humidity, and wind speed inputs.',
    formula: 'ETo = f(Rn, G, T, u₂, eₛ−eₐ, Δ, γ)   ETc = Kc × ETo',
    references: 'Allen, R. G., et al. (1998). "Crop evapotranspiration - Guidelines for computing crop water requirements." FAO Irrigation and Drainage Paper 56.'
  },
  '7-Day Evapotranspiration Historical Log': {
    category: 'farmer-inputs',
    desc: 'A 7-day log of daily crop water consumption and root zone soil water depletion — useful for irrigation planning.',
    done: 'Daily water balance model tracking soil water depletion, precipitation, irrigation, and crop transpiration.',
    formula: 'Dr,i = Dr,i−1 − (P − RO) − I + ETc + DP',
    references: 'Allen, R. G., et al. (1998). "Crop evapotranspiration - Guidelines for computing crop water requirements." FAO Irrigation and Drainage Paper 56.'
  },
  'Nutrient Profiling': {
    category: 'farmer-inputs',
    desc: 'Radar chart profiling nitrogen, phosphorus, potassium, pH, and organic carbon balances.',
    done: 'Zonal aggregation of soil test diagnostics and fertilizer log inputs.',
    formula: 'Nutrient_Score = f(SoilTest, FertilizerApplied)',
    references: 'Havlin, J. L., et al. (2013). "Soil Fertility and Fertilizers." Pearson.'
  },
  'Detailed Soil Chemistry Diagnostics': {
    category: 'farmer-inputs',
    desc: 'Detailed macronutrient and chemical recommendation guide based on plot soil testing.',
    done: 'Agronomic diagnostic engine analyzing macronutrient levels and suggesting topdressing rates.',
    formula: 'Recommendation = Target_N_P_K - Soil_N_P_K',
    references: 'Sparks, D. L. (2003). "Environmental Soil Chemistry." Academic Press.'
  },
  'Geospatial Mismatch Audits': {
    category: 'farmer-inputs',
    desc: 'Discrepancy logs matching farm coordinate claims against official forest registers.',
    done: 'Overlap analysis intersecting estate vector boundaries with protected area and official forest reserves databases.',
    formula: 'Mismatch_Area = Intersection(Estate_Boundary, Protected_Forest_Register)',
    references: 'OGC Simple Features Access Specification; ISO 19115.'
  },
  'Ingested Overpass Quality Control Ledger': {
    category: 'farmer-inputs',
    desc: 'Audit log showing pre-processing steps and cloud mask quality check results.',
    done: 'Automated QC pipeline evaluating cloud cover percentages and sensor health flags per overpass.',
    formula: 'Pass_QC = (Cloud_Cover < Cloud_Threshold) && (Sensor_Status == OK)',
    references: 'Sentinel-2 L2A Ingestion Quality Guidelines, ESA.'
  },
  'Deforestation Compliance Ledger': {
    category: 'farmer-inputs',
    desc: 'Deforestation warning patches mapping post-2020 tree canopy loss for compliance audits.',
    done: 'Tabular log of detected canopy loss events with location, area, and compliance status.',
    formula: 'Compliance = (Forest_Loss_Area < Compliance_Threshold)',
    references: 'Regulation (EU) 2023/1115 on Deforestation-free products.'
  },
  'Analytical Report Ledger': {
    category: 'farmer-inputs',
    desc: 'Exportable GIS reports ledger certifying spatial audits and sustainability compliance.',
    done: 'Generated PDF certificates containing maps, timeline trends, and compliance checklists.',
    formula: 'Report_Hash = SHA256(Report_Content)',
    references: 'EVM Smart Contract Carbon Registry standard specifications.'
  }
};
