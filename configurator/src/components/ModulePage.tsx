import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getProductModule } from '../products/catalog';
import { createDraftConfiguration } from '../products/configuration';
import { validateConfiguration } from '../rules/validation';
import { describeEstimate } from '../pricing/estimate';
import type { ProductId } from '../products/types';
import { ViewerScaffold } from '../viewer/ViewerScaffold';

/**
 * Grundgerüst eines Produktmoduls (CFG-001). Der eigentliche
 * Schrittassistent (Einbausituation → Masse → Profile → …) folgt in
 * Phase 4/5 – hier stehen bereits Zustand, Regelvorschau, Preisauskunft
 * und 3D-Grundgerüst in der verbindlichen Ebenentrennung.
 */
export function ModulePage({ productId }: { productId: ProductId }) {
  const module = getProductModule(productId);
  const draft = useMemo(() => createDraftConfiguration(productId), [productId]);
  const validation = useMemo(() => validateConfiguration(draft, []), [draft]);

  return (
    <>
      <p>
        <Link to="/">← Produktauswahl</Link>
      </p>
      <h1>{module.title}</h1>
      <p>{module.description}</p>

      <ViewerScaffold />

      {validation.warnings.length > 0 && (
        <div className="status-banner yellow" role="status">
          <strong>Hinweis:</strong>
          <ul>
            {validation.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <p>{describeEstimate(draft.estimate)}</p>
      <p>
        <small>
          Produktversion {draft.productVersion} · Regelversion {draft.ruleVersion} ·
          Preisversion {draft.priceVersion ?? 'keine (individuelle Prüfung)'}
        </small>
      </p>
    </>
  );
}
