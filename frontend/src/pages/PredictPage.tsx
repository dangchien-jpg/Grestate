import { useCallback, useEffect, useRef, useState } from "react";
import PredictForm from "@/components/predict/predict-form";
import PredictMap from "@/components/predict/predict-map";
import PredictResult from "@/components/predict/predict-result";
import {
  valuationError,
  valuationFieldErrors,
  valuationService,
} from "@/services/valuationService";
import type {
  Coordinates,
  GeocodedLocation,
  ValuationFieldErrors,
  ValuationMetadata,
  ValuationRequest,
  ValuationResult,
} from "@/types/valuation";
import Header from "@/components/layout/header";

export default function PredictPage() {
  const [metadata, setMetadata] = useState<ValuationMetadata | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates>({
    lat: 16.0611,
    lon: 108.2208,
  });
  const [suggestion, setSuggestion] = useState<GeocodedLocation | null>(null);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [pending, setPending] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ValuationFieldErrors>({});
  const [retry, setRetry] = useState(0);
  const submitting = useRef(false);
  const locationRequest = useRef<AbortController | null>(null);
  const predictionRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    valuationService
      .metadata(controller.signal)
      .then((data) => {
        setMetadata(data);
        setError("");
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(valuationError(error));
      });
    return () => controller.abort();
  }, [retry]);
  useEffect(
    () => () => {
      locationRequest.current?.abort();
      predictionRequest.current?.abort();
    },
    [],
  );

  const markDirty = useCallback(() => {
    locationRequest.current?.abort();
    setLocating(false);
    setResult(null);
    setError("");
    setFieldErrors({});
    setSuggestion(null);
    setLocationNotice("");
  }, []);
  function changeCoordinates(point: Coordinates) {
    markDirty();
    setCoordinates(point);
  }
  async function findLocation(query: string) {
    markDirty();
    const controller = new AbortController();
    locationRequest.current = controller;
    setLocating(true);
    try {
      const point = await valuationService.geocode(query, controller.signal);
      if (controller.signal.aborted) return;
      if (point) {
        setCoordinates({ lat: point.lat, lon: point.lon });
        setSuggestion(point);
        setLocationNotice(
          "Đã tìm thấy vị trí. Kiểm tra ghim và địa chỉ trước khi định giá.",
        );
      } else
        setLocationNotice(
          "Không tìm thấy địa chỉ trong khu vực hỗ trợ. Bạn có thể ghim thủ công.",
        );
    } catch (error) {
      if (!controller.signal.aborted) setLocationNotice(valuationError(error));
    } finally {
      if (!controller.signal.aborted) setLocating(false);
    }
  }
  async function pickMap(point: Coordinates) {
    if (submitting.current) return;
    changeCoordinates(point);
    const controller = new AbortController();
    locationRequest.current = controller;
    setLocating(true);
    try {
      const address = await valuationService.reverseGeocode(
        point,
        controller.signal,
      );
      if (!controller.signal.aborted) {
        setSuggestion(address);
        setLocationNotice(
          "Đã chọn ghim. Kiểm tra quận/phường và tên đường tương ứng trước khi định giá.",
        );
      }
    } catch {
      if (!controller.signal.aborted)
        setLocationNotice(
          "Đã giữ vị trí ghim. Không tra cứu được tên đường; bạn có thể nhập thủ công.",
        );
    } finally {
      if (!controller.signal.aborted) setLocating(false);
    }
  }
  async function submit(payload: ValuationRequest) {
    if (submitting.current || locating) return;
    submitting.current = true;
    setPending(true);
    setError("");
    setFieldErrors({});
    setResult(null);
    locationRequest.current?.abort();
    const controller = new AbortController();
    predictionRequest.current = controller;
    try {
      const response = await valuationService.predict(
        payload,
        controller.signal,
      );
      if (!controller.signal.aborted) setResult(response);
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(valuationError(error));
        setFieldErrors(valuationFieldErrors(error));
      }
    } finally {
      submitting.current = false;
      if (!controller.signal.aborted) setPending(false);
    }
  }
  return (
    <>
      <Header />
      <main className="min-h-screen px-4 py-8 ">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
            {!metadata && (
              <button
                onClick={() => {
                  setError("");
                  setRetry((value) => value + 1);
                }}
                className="ml-3 underline"
              >
                Thử lại
              </button>
            )}
          </div>
        )}
        {!metadata ? (
          <p role="status">
            {error
              ? "Chưa tải được dữ liệu định giá."
              : "Đang tải dữ liệu định giá..."}
          </p>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <PredictForm
                metadata={metadata.location_meta}
                coordinates={coordinates}
                onCoordinatesChange={changeCoordinates}
                onSubmit={submit}
                onDirty={markDirty}
                pending={pending}
                locating={locating}
                onFindLocation={findLocation}
                suggestion={suggestion}
                serverErrors={fieldErrors}
              />
            </div>
            <div className="space-y-6 lg:col-span-5">
              <PredictMap
                coordinates={coordinates}
                onChange={(point) => {
                  void pickMap(point);
                }}
                disabled={pending}
                bounds={metadata.location_meta.bounds}
              />
              {locationNotice && (
                <p role="status" className="text-sm ">
                  {locationNotice}
                </p>
              )}
              <PredictResult result={result} pending={pending} />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
