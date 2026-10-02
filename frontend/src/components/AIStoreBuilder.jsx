import React, { useState, useEffect } from 'react';
import {
ArrowLeft,
Sparkles,
Image as ImageIcon,
Loader2,
Wand2,
Share2,
ExternalLink,
Trash2
} from 'lucide-react';
import api from '../api/axios';
import { useStore } from '../context/StoreContext';

export default function AIStoreBuilder({
activeStore,
categoriesList,
productsList,
onBack
}) {
const { createStore, setActiveStore } = useStore();

const [prompt, setPrompt] = useState('');
const [generating, setGenerating] = useState(false);
const [error, setError] = useState(null);
const [successUrl, setSuccessUrl] = useState('');
const [aiConfigs, setAiConfigs] = useState([]);
const [loadingConfigs, setLoadingConfigs] = useState(false);

const [createdStore, setCreatedStore] = useState(null);
const [showAiCreateModal, setShowAiCreateModal] = useState(false);
const [aiStorePrompt, setAiStorePrompt] = useState('');
const [isAiCreating, setIsAiCreating] = useState(false);

  useEffect(() => {
    setLoadingConfigs(true);
    
    // Fetch all stores to collect all AI generated sites across the entire account
    api.get('/stores')
      .then((res) => {
        let allConfigs = [];
        const storeList = res.data?.data || res.data || [];
        
        if (Array.isArray(storeList)) {
          storeList.forEach(st => {
            const configs = st.ai_configurations || st.aiConfigurations || [];
            if (Array.isArray(configs)) {
              configs.forEach(cfg => {
                allConfigs.push({
                  ...cfg,
                  storeObj: st // attach the store object so we know the slug/name
                });
              });
            }
          });
        }
        
        // Sort by newest first
        allConfigs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setAiConfigs(allConfigs);
      })
      .catch((err) => {
        console.error('Failed to load stores/configs', err);
        setAiConfigs([]);
      })
      .finally(() => setLoadingConfigs(false));
  }, [activeStore?.id, createdStore?.id]);

const handleGenerate = async (e) => {
e.preventDefault();


if (!prompt.trim()) return;

setGenerating(true);
setError(null);

try {
  let store = activeStore || createdStore;

  /*
   * STEP 1:
   * Create a new store if no store is currently selected.
   */
  if (!store || !store.id) {
    const createRes = await createStore({
      ai_prompt: prompt
    });

    if (!createRes.success || !createRes.store) {
      throw new Error(
        createRes.message || 'Failed to create store.'
      );
    }

    store = createRes.store;
    setCreatedStore(store);

    console.log(
      'AI Builder store created:',
      store.id
    );

    if (setActiveStore) {
      setActiveStore(store);
    }
  } else {
    /*
     * Existing store flow.
     */
    store = activeStore;
  }

  /*
   * STEP 2:
   * Send the newly created/existing store to the AI Builder.
   *
   * This is the important part that was missing
   * from the new-store flow.
   */
  const storeData = {
    store_id: store.id,
    category: store.category,
    store_name: store.name,
    prompt: prompt,

    /*
     * Existing categories/products are provided as context.
     * AI must not create fake products or categories.
     */
    categories: (categoriesList || []).map((c) => ({
      id: c.id,
      name: c.name
    })),

    products: (productsList || []).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category
    }))
  };

  console.log(
    'Generating AI website for store:',
    store.id
  );

  /*
   * STEP 3:
   * Gemini configuration + Cloudflare hero generation
   * are handled by the Laravel backend.
   */
  const aiRes = await api.post(
    '/ai-builder/generate',
    storeData,
    {
      timeout: 120000
    }
  );

  if (aiRes.data?.success) {
    /*
     * Use the newly created store object rather than
     * the old activeStore value.
     */
    setSuccessUrl(
      `${window.location.protocol}//${window.location.host}/store/${
        store.slug || store.subdomain || 'demo'
      }?preview_ai=true`
    );
  } else {
    throw new Error(
      aiRes.data?.message ||
        'Failed to generate AI website.'
    );
  }
} catch (err) {
  console.error(
    'AI Builder generation failed:',
    err
  );

  setError(
    err.response?.data?.message ||
      err.message ||
      'An unexpected error occurred.'
  );
} finally {
  setGenerating(false);
}


};

/*

* Separate AI store creation flow.
*
* This flow is kept for compatibility with the
* existing UI. After creating the store, it also
* runs the AI generation endpoint.
  */
  const handleAiCreateStore = async (e) => {
  e.preventDefault();


if (!aiStorePrompt.trim()) return;



setIsAiCreating(true);
setError(null);

let category = 'General Retail';
let name = 'AI Generated Store';

try {
  /*
   * Extract business information from the prompt.
   */
  try {
    const extractRes = await api.post(
      '/ai-builder/extract-profile',
      {
        prompt: aiStorePrompt
      }
    );

    if (
      extractRes.data &&
      extractRes.data.profile
    ) {
      name =
        extractRes.data.profile.name ||
        name;

      category =
        extractRes.data.profile.category ||
        category;
    }
  } catch (err) {
    console.error(
      'Failed to extract store profile from AI',
      err
    );
  }

  /*
   * Create the store.
   */
  const newStoreData = {
    name,
    category,
    slug: name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-'),
    subdomain: name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-'),
    status: 'Active',
    currency: 'USD'
  };

  const createRes =
    await createStore(newStoreData);

  if (!createRes.success || !createRes.store) {
    throw new Error(
      createRes.message ||
        'Failed to create store via AI.'
    );
  }

  const newStore = createRes.store;

  console.log(
    'AI-created store:',
    newStore.id
  );

  if (setActiveStore) {
    setActiveStore(newStore);
  }

  /*
   * Generate the actual AI website after
   * the store has been created.
   */
  const storeData = {
    store_id: newStore.id,
    category: newStore.category,
    store_name: newStore.name,
    prompt: aiStorePrompt,

    categories: [],
    products: []
  };

  console.log(
    'Generating AI website for newly created store:',
    newStore.id
  );

  const aiRes = await api.post(
    '/ai-builder/generate',
    storeData,
    {
      timeout: 120000
    }
  );

  if (!aiRes.data?.success) {
    throw new Error(
      aiRes.data?.message ||
        'Store was created, but AI website generation failed.'
    );
  }

  setSuccessUrl(
    `${window.location.protocol}//${window.location.host}/store/${
      newStore.slug ||
      newStore.subdomain ||
      'demo'
    }?preview_ai=true`
  );

  setAiStorePrompt('');
  setShowAiCreateModal(false);
} catch (err) {
  console.error(
    'AI store creation failed:',
    err
  );

  setError(
    err.response?.data?.message ||
      err.message ||
      'Failed to create AI store.'
  );
} finally {
  setIsAiCreating(false);
}
}

const handleDeleteConfig = async (id) => {
  if (!window.confirm('Are you sure you want to delete this AI Store version?')) {
    return;
  }

  try {
    await api.delete(`/ai-builder/${id}`);

  setAiConfigs((prev) =>
    prev.filter((cfg) => cfg.id !== id)
  );
} catch (err) {
  console.error(err);
  alert('Failed to delete configuration.');
}


};

/*

* AI generation success screen.
  */
  if (successUrl) {
  return (

   <div
     className="d-flex flex-column align-items-center justify-content-center p-5 text-center bg-white rounded-3 border mt-4"
     style={{ minHeight: 400 }}
   >
     <div
       className="mb-4 bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
       style={{
         width: 80,
         height: 80
       }}
     >
       <Sparkles size={40} />
     </div>

     <h3 className="fs-3 fw-bold mb-3 text-dark">
       Your AI Website is Ready!
     </h3>

     <p
       className="fs-6 text-muted mb-4"
       style={{ maxWidth: 500 }}
     >
       We've successfully generated a beautiful,
       colorful, and highly attractive online store
       tailored for{' '}
       <b>
         {activeStore?.name ||
           'your new store'}
       </b>{' '}
       based on your prompt.
     </p>

     <div className="d-flex justify-content-center gap-3 mt-4 flex-wrap">
       <a
         href={successUrl}
         target="_blank"
         rel="noopener noreferrer"
         className="btn btn-lg btn-dark fw-bold px-4 rounded-pill shadow"
       >
         View Live Store
       </a>

  
   <button
     onClick={() => setSuccessUrl('')}
     className="btn btn-lg btn-outline-secondary fw-bold px-4 rounded-pill"
   >
     Edit with AI
   </button>

   <button
     onClick={() => {
       if (navigator.share) {
         navigator
           .share({
             title: `${
               activeStore?.name || 'My'
             } Store`,
             text: `Check out my new AI-generated store: ${
               activeStore?.name || ''
             }!`,
             url: successUrl
           })
           .catch(console.error);
       } else {
         navigator.clipboard.writeText(
           successUrl
         );

         alert(
           'Link copied to clipboard!'
         );
       }
     }}
     className="btn btn-lg btn-outline-primary fw-bold px-4 rounded-pill d-flex align-items-center gap-2"
   >
     <Share2 size={20} /> Share
   </button>
  

     </div>
   </div>

);


}

return ( <div className="d-flex flex-column gap-4">
{/* Header */} <div className="d-flex align-items-center gap-3">
<button
onClick={onBack}
className="btn btn-light border-0 shadow-sm rounded-circle d-flex align-items-center justify-content-center"
style={{
width: 40,
height: 40
}}
>
        <ArrowLeft size={18} />
      </button>

      <div>
        <h2 className="fs-4 fw-bold mb-0 text-dark d-flex align-items-center gap-2">
        <Sparkles
          size={24}
          style={{ color: '#00f2fe' }}
        />{' '}
        AI Website Builder
      </h2>

      <p className="fs-8 text-muted mb-0">
        {activeStore
          ? `Generate a custom storefront for ${activeStore.name}`
          : 'Generate a completely new storefront from scratch'}
      </p>
    </div>
  </div>

  <div className="row g-4">
    {/* Input Section */}
    <div className="col-12 col-lg-8">
      <div className="bg-white rounded-4 shadow-sm border p-4">
        <h5 className="fw-bold mb-3">
          Describe Your Dream Store
        </h5>

        <form onSubmit={handleGenerate}>
          <div className="mb-4">
            <label className="form-label fs-7 fw-semibold text-secondary">
              What kind of design do you want?
            </label>

            <textarea
              className="form-control"
              rows="4"
              value={prompt}
              onChange={(e) =>
                setPrompt(e.target.value)
              }
              placeholder="e.g., Create a luxury jewelry store with an elegant gold, white, and beige design, premium jewelry hero banner, and modern product sections. Keep existing products and categories unchanged."
              style={{
                borderRadius: '12px',
                resize: 'none',
                backgroundColor: '#f8fafc'
              }}
              required
            />
          </div>

          {error && (
            <div className="alert alert-danger fs-8 py-2 rounded-3 mb-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              generating ||
              !prompt.trim()
            }
            className="btn w-100 fw-bold py-3 text-white rounded-pill d-flex align-items-center justify-content-center gap-2 shadow"
            style={{
              background: generating
                ? '#cbd5e1'
                : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              transition: 'all 0.3s'
            }}
          >
            {generating ? (
              <>
                <Loader2
                  size={20}
                  className="spinner"
                />
                AI is designing your store...
              </>
            ) : (
              <>
                <Wand2 size={20} />
                Generate Beautiful Website
              </>
            )}
          </button>
        </form>
      </div>
    </div>

    {/* Data Context Section */}
    <div className="col-12 col-lg-4">
      <div className="bg-light rounded-4 border p-4 h-100">
        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
          <ImageIcon size={18} />
          Store Data Included
        </h6>

        <p className="fs-8 text-muted mb-4">
          The AI will automatically incorporate
          your existing inventory into the design.
          No need to re-enter data.
        </p>

        <div className="d-flex flex-column gap-3">
          <div className="bg-white p-3 rounded-3 shadow-sm border">
            <div className="fs-8 fw-semibold text-secondary mb-1">
              Collections (
              {(categoriesList || []).length})
            </div>

            <div className="d-flex flex-wrap gap-1">
              {(categoriesList || [])
                .slice(0, 5)
                .map((c) => (
                  <span
                    key={c.id}
                    className="badge bg-light text-dark border"
                  >
                    {c.name}
                  </span>
                ))}

              {(categoriesList || []).length >
                5 && (
                <span className="badge bg-light text-dark border">
                  +
                  {(categoriesList || [])
                    .length - 5}{' '}
                  more
                </span>
              )}
            </div>
          </div>

          <div className="bg-white p-3 rounded-3 shadow-sm border">
            <div className="fs-8 fw-semibold text-secondary mb-1">
              Products (
              {(productsList || []).length})
            </div>

            <div className="d-flex flex-wrap gap-1">
              {(productsList || [])
                .slice(0, 5)
                .map((p) => (
                  <span
                    key={p.id}
                    className="badge bg-light text-dark border"
                  >
                    {p.name}
                  </span>
                ))}

              {(productsList || []).length >
                5 && (
                <span className="badge bg-light text-dark border">
                  +
                  {(productsList || [])
                    .length - 5}{' '}
                  more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Current Store Section */}
  <div className="bg-white rounded-4 shadow-sm border p-4 mt-2">
    <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
      <Sparkles
        size={20}
        className="text-primary"
      />{' '}
      Your Generated AI Stores
    </h5>

    <p className="fs-7 text-muted mb-4">
      You can preview your previously generated
      AI-powered storefronts and share them with
      others.
    </p>

    {loadingConfigs ? (
      <div className="text-center py-4 text-muted">
        <Loader2
          className="spinner mb-2"
          size={24}
        />
        <p className="fs-8">
          Loading your generated stores...
        </p>
      </div>
    ) : aiConfigs.length === 0 ? (
      <div className="text-muted fs-8 text-center py-3 border rounded bg-light">
        You haven't generated any AI stores yet.
      </div>
    ) : (
      <div className="d-flex flex-column gap-3">
        {aiConfigs.map((cfg) => {
          const storeForCfg = cfg.storeObj || activeStore;
          const url = `${
            window.location.protocol
          }//${window.location.host}/store/${
            storeForCfg?.slug ||
            storeForCfg?.subdomain ||
            'demo'
          }?preview_ai=true&config_id=${
            cfg.id
          }`;

          const dt = new Date(
            cfg.created_at
          ).toLocaleString();

          let styleName = 'Modern Theme';

          try {
            const conf =
              typeof cfg.configuration ===
              'string'
                ? JSON.parse(
                    cfg.configuration
                  )
                : cfg.configuration;

            if (
              conf?.typography?.headingFont?.includes(
                'Playfair'
              )
            ) {
              styleName = 'Luxury Theme';
            } else if (
              conf?.style?.borderRadius ===
              '0px'
            ) {
              styleName = 'Minimal Theme';
            }
          } catch (e) {}

          return (
            <div
              key={cfg.id}
              className="d-flex flex-wrap align-items-center justify-content-between p-3 border rounded-3 bg-light"
            >
              <div>
                <h6 className="fw-bold mb-1">
                  {storeForCfg?.name || 'Store'} - Version {cfg.version}
                </h6>

                <div className="fs-8 text-muted">
                  {styleName} • Generated on: {dt}
                </div>
              </div>

              <div className="d-flex gap-2 mt-2 mt-sm-0">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-dark fw-bold px-3 shadow-sm d-flex align-items-center gap-1"
                >
                  <ExternalLink
                    size={14}
                  />{' '}
                  Preview
                </a>

                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator
                        .share({
                          title: `${
                            storeForCfg?.name ||
                            'My'
                          } Store - v${
                            cfg.version
                          }`,
                          url
                        })
                        .catch(
                          console.error
                        );
                    } else {
                      navigator.clipboard.writeText(
                        url
                      );

                      alert(
                        'Link copied to clipboard!'
                      );
                    }
                  }}
                  className="btn btn-sm btn-outline-primary fw-bold px-3 d-flex align-items-center gap-1"
                >
                  <Share2 size={14} /> Share
                </button>

                <button
                  onClick={() =>
                    handleDeleteConfig(
                      cfg.id
                    )
                  }
                  className="btn btn-sm btn-outline-danger fw-bold px-3 d-flex align-items-center gap-1"
                  title="Delete"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
</div>


);
}
