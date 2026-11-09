export interface Coordinates {
  lat: number;
  lon: number;
}
export interface ValuationRequest extends Coordinates {
  district: string;
  ward: string;
  street: string;
  property_type: string;
  legal_status: string;
  direction: string;
  area: number;
  frontage: number;
  road_width: number;
  num_bedrooms: number;
  num_toilets: number;
  num_floors: number;
  amenity_text: string;
}
export interface ValuationResult {
  status: "success";
  total_price_billion: number;
  unit_price_million_m2: number;
  min_price_billion: number;
  max_price_billion: number;
  dist_center_km: number;
  dist_beach_km: number;
  model_name: string;
  model_version: string;
  interval_nominal_coverage: number;
  interval_test_coverage: number;
  warnings: string[];
}
export interface LocationMetadata {
  districts: Record<
    string,
    Coordinates & { wards: string[]; streets: string[] }
  >;
  property_types: string[];
  directions: string[];
  legal_statuses: string[];
  bounds: { south: number; north: number; west: number; east: number };
  area_min: number;
  area_max: number;
}
export interface ModelScores {
  n: number;
  r2: number;
  mae: number;
  rmse: number;
  mape: number;
  within_10_percent: number;
}
export interface ValuationMetadata {
  location_meta: LocationMetadata;
  model: {
    name: string;
    version: string;
    data_end: string;
    location_resolution: string;
  };
  metrics: {
    selection_metric: string;
    selected_model: string;
    validation: Record<string, ModelScores>;
    test: ModelScores & { interval_coverage: number };
    test_by_property_type: Record<string, ModelScores>;
  };
}
export interface GeocodedLocation extends Coordinates {
  street: string;
  district: string;
  label: string;
}
export type ValuationFieldErrors = Partial<
  Record<keyof ValuationRequest, string>
>;
