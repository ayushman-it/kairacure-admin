import React, { useState, useMemo, useEffect, useRef } from 'react';

const STEP_LABELS = ['Treatment', 'Procedure', 'Trip Style', 'Hospital', 'Plan Journey'];

let _prevStep = 0;

function PlannerStepsBar({ currentStep = 1 }) {
  const step    = Math.min(Math.max(currentStep, 1), 5);
  const barRef  = useRef(null);
  const dotRefs = useRef([]);
  const exitRef = useRef(null);
  const planeRef = useRef(null);

  const [planeLeft,  setPlaneLeft]  = useState(null);
  const [flying,     setFlying]     = useState(false);   // arc animation active
  const [flyKey,     setFlyKey]     = useState(0);       // increment to re-trigger keyframe
  const [exited,     setExited]     = useState(false);
  const [direction,  setDirection]  = useState('right'); // 'right' | 'left'

  const [isTransitioning, setIsTransitioning] = useState(false);

  const getCentre = (n) => {
    const bar = barRef.current;
    const dot = dotRefs.current[n - 1];
    if (!bar || !dot) return null;
    const barRect = bar.getBoundingClientRect();
    const dotRect = dot.getBoundingClientRect();
    return dotRect.left - barRect.left + dotRect.width / 2;
  };

  useEffect(() => {
    const target = getCentre(step);
    if (target === null) return;

    if (_prevStep === 0) {
      // Very first mount — appear at step 1
      const s1 = getCentre(1);
      setPlaneLeft(s1 ?? target);
      setDirection('right');
      _prevStep = step;

      // If starting at step > 1, smoothly move there
      if (step > 1) {
        setTimeout(() => {
          setIsTransitioning(true);
          setDirection('right');
          setFlying(true);
          setFlyKey(k => k + 1);
          setPlaneLeft(target);
          
          // End transition after animation completes
          setTimeout(() => {
            setIsTransitioning(false);
            setFlying(false);
          }, 2200);
        }, 100);
      }
    } else {
      // Step changed — smooth fly with proper transition control
      clearTimeout(exitRef.current);
      setExited(false);
      setIsTransitioning(true);
      setDirection('right');
      setFlying(true);
      setFlyKey(k => k + 1);
      
      // Start the position change after a small delay
      setTimeout(() => {
        setPlaneLeft(target);
      }, 50);
      
      // End transition after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
        setFlying(false);
      }, 2200);
      
      _prevStep = step;

      if (step === 5) {
        exitRef.current = setTimeout(() => setExited(true), 3500);
      }
    }

    const onResize = () => {
      if (!isTransitioning) {
        const t = getCentre(step);
        if (t !== null) setPlaneLeft(t);
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      clearTimeout(exitRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [step]); // eslint-disable-line

  // After arc animation ends — reset flying flag so bob resumes
  const handleAnimEnd = () => {
    setFlying(false);
    setIsTransitioning(false);
  };

  return (
    <div className="planner-progress-steps" ref={barRef}>

      {planeLeft !== null && (
        <div
          ref={planeRef}
          className={`ppa-wrap${exited ? ' ppa-exiting' : ''}`}
          style={{
            left: `${planeLeft}px`,
            transition: isTransitioning 
              ? 'left 2.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
              : 'none',
            opacity: exited ? 0 : 1,
            visibility: 'visible',
          }}
          aria-hidden="true"
        >
          {/* Contrail */}
          <span className="ppa-trail" />

          {/* Plane icon — arc key resets animation */}
          <i
            key={flyKey}
            className={`fa-solid fa-plane ppa-icon${flying ? ' ppa-fly-right' : ''}`}
            onAnimationEnd={handleAnimEnd}
          />

          {/* Sparks — only visible while flying */}
          {flying && <>
            <span className="ppa-spark s1" />
            <span className="ppa-spark s2" />
            <span className="ppa-spark s3" />
          </>}
        </div>
      )}

      <div className="progress-steps-container">
        {STEP_LABELS.map((label, i) => {
          const n        = i + 1;
          const isDone   = n < step;
          const isActive = n === step;
          return (
            <React.Fragment key={label}>
              {i > 0 && (
                <div className={`progress-step-connector${isDone ? ' filled' : ''}`} />
              )}
              <div
                className={`progress-step${isDone ? ' completed' : isActive ? ' active' : ''}`}
                ref={el => { dotRefs.current[i] = el; }}
              >
                <div className="step-number">
                  {isDone ? <i className="fa-solid fa-check" aria-hidden="true" /> : n}
                </div>
                <span>{label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function getPlannerTreatmentTitle(treatment = {}) {
  let displayTitle = treatment.title || 'Treatment';
  displayTitle = displayTitle
    .replace(/Other specified certain joint disorders, not elsewhere classified/gi, 'Joint Treatment')
    .replace(/Abrasion of knee/gi, 'Knee Treatment')
    .replace(/Inflammatory arthropathies, unspecified/gi, 'Arthritis Treatment')
    .replace(/Other specified.*not elsewhere classified/gi, 'Specialized Treatment')
    .replace(/Certain disorders.*not elsewhere classified/gi, 'Medical Treatment')
    .replace(/Other specified/gi, 'Specialized')
    .replace(/not elsewhere classified/gi, '')
    .replace(/,\s*$/g, '')
    .trim();

  return displayTitle.length > 42 ? `${displayTitle.slice(0, 39)}...` : displayTitle;
}

// Modern Professional Treatment Search Page Component
export function PlannerSearchPage({ 
  treatments = [], 
  onSearchHospitals, 
  getTreatmentIconKind,
  plannerStep = 1,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedTreatments, setSelectedTreatments] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [leadId, setLeadId] = useState(null);

  // Track lead when component mounts
  useEffect(() => {
    const trackLead = async () => {
      try {
        const response = await fetch('/api/leads/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step: 'treatment_search',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setLeadId(data.leadId);
        }
      } catch (error) {
        console.log('Lead tracking failed:', error);
      }
    };
    
    trackLead();
  }, []);

  // Update lead when treatments are selected
  useEffect(() => {
    if (leadId && selectedTreatments.length > 0) {
      fetch('/api/leads/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          step: 'treatments_selected',
          data: {
            selectedTreatments: selectedTreatments.map(t => ({
              id: t.id,
              title: t.title,
              category: t.category || t.group
            }))
          }
        })
      }).catch(error => console.log('Lead update failed:', error));
    }
  }, [leadId, selectedTreatments]);

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(treatments.map(t => t.group || t.category || 'Medical'))];
    return cats;
  }, [treatments]);

  const filteredTreatments = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let filtered = treatments;

    if (activeCategory !== 'All') {
      filtered = filtered.filter(t => 
        (t.group || t.category) === activeCategory
      );
    }

    if (query) {
      filtered = filtered.filter(t => {
        const searchText = `${t.title} ${t.group} ${t.category} ${t.specialty} ${t.description || ''}`.toLowerCase();
        return searchText.includes(query);
      });
    }

    return filtered;
  }, [treatments, searchQuery, activeCategory]);

  const autocompleteOptions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const options = treatments
      .filter(t => {
        const searchText = `${t.title} ${t.group} ${t.specialty}`.toLowerCase();
        return searchText.includes(query);
      })
      .slice(0, 8);
    
    return options;
  }, [searchQuery, treatments]);

  const toggleTreatment = (treatment) => {
    setSelectedTreatments(prev => {
      const exists = prev.find(t => t.id === treatment.id);
      if (exists) {
        return prev.filter(t => t.id !== treatment.id);
      }
      return [...prev, treatment];
    });
  };

  const handleSearchHospitals = () => {
    if (selectedTreatments.length > 0) {
      // Track step completion before proceeding
      if (leadId) {
        fetch('/api/leads/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            step: 'treatment_search_completed',
            data: {
              selectedTreatments: selectedTreatments.map(t => t.title),
              searchQuery: searchQuery,
              activeCategory: activeCategory
            }
          })
        }).catch(error => console.log('Lead update failed:', error));
      }
      
      onSearchHospitals(selectedTreatments);
    }
  };

  const getTreatmentIcon = (treatment) => {
    // Use the same TreatmentVectorIcon component from home page
    const iconKind = getTreatmentIconKind ? getTreatmentIconKind(treatment) : 'general';
    
    const iconClasses = {
      cardiac: 'fa-heart-pulse',
      orthopedics: 'fa-bone',
      oncology: 'fa-ribbon',
      spine: 'fa-staff-snake',
      urology: 'fa-prescription-bottle-medical',
      gynecology: 'fa-venus',
      infertility: 'fa-baby',
      hair: 'fa-person',
      dental: 'fa-tooth',
      plastic: 'fa-user-doctor',
      wellness: 'fa-spa',
      'neuro-wellness': 'fa-brain',
      neurology: 'fa-brain',
      ophthalmology: 'fa-eye',
      gastroenterology: 'fa-capsules',
      emergency: 'fa-truck-medical',
      pediatrics: 'fa-child',
      ent: 'fa-ear-listen',
      general: 'fa-briefcase-medical',
    };

    const iconClass = iconClasses[iconKind] || iconClasses.general;
    
    return (
      <i 
        aria-hidden="true" 
        className={`fa-solid ${iconClass}`}
        style={{ fontSize: '2rem', color: 'inherit' }}
      />
    );
  };

  return (
    <div className="planner-search-page">
      <PlannerStepsBar currentStep={plannerStep} />

      {/* Hero Search Section */}
      <div className="planner-hero-search">
        <div className="planner-search-content">
          <div className="planner-search-header">
            <h1>Find Your Treatment</h1>
            <p>Search from 100+ treatments across India's top hospitals</p>
          </div>

          {/* Search Bar with Autocomplete */}
          <div className="planner-search-bar-wrapper">
            <div className="planner-search-bar">
              <i className="fa-solid fa-magnifying-glass search-icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search treatments, procedures, or specialists..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowAutocomplete(true);
                }}
                onFocus={() => setShowAutocomplete(true)}
                className="planner-search-input"
              />
              {searchQuery && (
                <button 
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setShowAutocomplete(false);
                  }}
                  type="button"
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {showAutocomplete && searchQuery && autocompleteOptions.length > 0 && (
              <div className="planner-autocomplete">
                {autocompleteOptions.map((treatment) => (
                  <button
                    key={treatment.id}
                    className="autocomplete-item"
                    onClick={() => {
                      toggleTreatment(treatment);
                      setSearchQuery('');
                      setShowAutocomplete(false);
                    }}
                    type="button"
                  >
                    <span className="autocomplete-icon">{getTreatmentIcon(treatment)}</span>
                    <div className="autocomplete-content">
                      <strong>{getPlannerTreatmentTitle(treatment)}</strong>
                      <small>{treatment.group || treatment.category} - {treatment.value || 85}% rated value for money</small>
                    </div>
                    <i className="fa-solid fa-plus" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Treatments Pills */}
          {selectedTreatments.length > 0 && (
            <div className="planner-selected-pills">
              {selectedTreatments.map((treatment) => (
                <span key={treatment.id} className="treatment-pill">
                  {getPlannerTreatmentTitle(treatment)}
                  <button
                    onClick={() => toggleTreatment(treatment)}
                    className="pill-remove"
                    type="button"
                  >
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Filters */}
      <div className="planner-categories">
        <div className="categories-wrapper">
          {categories.map((cat) => (
            <button
              key={cat}
              className={activeCategory === cat ? 'category-btn active' : 'category-btn'}
              onClick={() => setActiveCategory(cat)}
              type="button"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Treatment Grid */}
      <div className="planner-treatments-grid">
        <div className="treatments-grid-container">
          {treatments.length === 0 && (
            <div className="planner-loading-state">
              <i className="fa-solid fa-stethoscope" aria-hidden="true" />
              <strong>Loading treatments</strong>
              <p>Preparing treatment options from the hospital catalog.</p>
            </div>
          )}
          {treatments.length > 0 && filteredTreatments.length === 0 && (
            <div className="planner-loading-state">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <strong>No treatments found</strong>
              <p>Try another treatment, procedure, or specialty.</p>
            </div>
          )}
          {filteredTreatments.map((treatment) => {
            const isSelected = selectedTreatments.some(t => t.id === treatment.id);
            const hasCosting = treatment.packageFrom && treatment.packageFrom > 0;
            const valueScore = Number(treatment.value || 0);
            
            return (
              <article
                key={treatment.id}
                className={isSelected ? 'treatment-card selected' : 'treatment-card'}
                onClick={() => toggleTreatment(treatment)}
              >
                <div className="treatment-card-icon">
                  {getTreatmentIcon(treatment)}
                </div>
                
                <h3 className="treatment-card-title">{getPlannerTreatmentTitle(treatment)}</h3>
                
                <span className="treatment-category">{treatment.group || treatment.category}</span>
                
                {/* Subtle costing display */}
                {hasCosting && (
                  <div className="treatment-cost-subtle">
                    From ₹{(treatment.packageFrom / 100000).toFixed(1)}L
                  </div>
                )}
                
                {valueScore > 0 && (
                  <div className="treatment-rating">
                    <i className="fa-solid fa-star" aria-hidden="true" />
                    <small>{valueScore}% value</small>
                  </div>
                )}
                
                <div className="treatment-card-check">
                  {isSelected ? (
                    <i className="fa-solid fa-circle-check" aria-hidden="true" />
                  ) : (
                    <i className="fa-regular fa-circle" aria-hidden="true" />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Floating Action Footer — Step 1 */}
      <div className={`planner-step-footer${selectedTreatments.length > 0 ? ' visible' : ''}`}>
        <div className="planner-step-footer-inner">
          <div className="planner-step-footer-summary">
            {selectedTreatments.length > 0 ? (
              <>
                <i className="fa-solid fa-circle-check" aria-hidden="true" style={{color:'#22c55e'}} />
                <span><strong>{selectedTreatments.length}</strong> treatment{selectedTreatments.length > 1 ? 's' : ''} selected</span>
                <div className="footer-pills">
                  {selectedTreatments.slice(0, 2).map((t) => (
                    <span key={t.id} className="footer-pill">{getPlannerTreatmentTitle(t)}</span>
                  ))}
                  {selectedTreatments.length > 2 && <span className="footer-pill-more">+{selectedTreatments.length - 2}</span>}
                </div>
              </>
            ) : (
              <span className="footer-hint"><i className="fa-solid fa-hand-pointer" aria-hidden="true" /> Select a treatment to continue</span>
            )}
          </div>
          <button
            className="planner-footer-btn"
            onClick={handleSearchHospitals}
            disabled={selectedTreatments.length === 0}
            type="button"
          >
            <span>Select Procedure</span>
            <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ICD-11 procedure icon mapping — same icon system as treatment cards
function getProcedureIconClass(proc = {}) {
  const text = `${proc.group || ''} ${proc.category || ''} ${proc.specialty || ''} ${proc.title || ''}`.toLowerCase();
  if (/cardiac|heart|coronary|bypass|valve|aorta|pacemaker|arrhythmia/i.test(text)) return 'fa-heart-pulse';
  if (/ortho|bone|knee|hip|joint|spine|vertebra|fracture|scoliosis/i.test(text)) return 'fa-bone';
  if (/cancer|tumor|oncol|carcinoma|lymphoma|leukemia|melanoma/i.test(text)) return 'fa-ribbon';
  if (/neuro|brain|neural|stroke|epilepsy|parkinson|cerebral|spinal/i.test(text)) return 'fa-brain';
  if (/eye|retina|cataract|glaucoma|cornea|vision|ophthal/i.test(text)) return 'fa-eye';
  if (/gastro|liver|intestin|colon|bowel|stomach|pancrea|hernia|bariatric/i.test(text)) return 'fa-capsules';
  if (/lung|respiratory|bronch|asthma|pulmon|pleura/i.test(text)) return 'fa-lungs';
  if (/kidney|renal|urology|bladder|prostate|ureter/i.test(text)) return 'fa-prescription-bottle-medical';
  if (/diabet|thyroid|endocrin|hormone|insulin|adrenal/i.test(text)) return 'fa-syringe';
  if (/skin|dermat|psoria|cosmetic|hair|rhinoplasty|liposuction|aesthetic|plastic/i.test(text)) return 'fa-user-doctor';
  if (/gynecol|uterus|ovary|fibroid|pregnan|fertility|ivf|hysterect/i.test(text)) return 'fa-venus';
  if (/dental|tooth|teeth|orthodont|gum|root canal/i.test(text)) return 'fa-tooth';
  if (/ear|nose|throat|sinusit|tonsil|hearing|cochlear/i.test(text)) return 'fa-ear-listen';
  if (/wellness|ayurved|yoga|meditation|detox|physio|rehab/i.test(text)) return 'fa-spa';
  if (/pediatric|child|neonat/i.test(text)) return 'fa-child';
  return 'fa-file-medical';
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Procedure Selection Page
// Shows ICD-11 imported procedures that belong to the selected treatment groups.
// If none are in DB it shows a "no procedures yet" state and still lets the user continue.
// ─────────────────────────────────────────────────────────────────────────────
export function ProcedureSelectPage({
  selectedTreatments = [],
  preSelectedProcedures = [],
  allTreatments = [],
  onContinue,
  onBack,
  plannerStep = 2,
}) {
  const [selectedProcedures, setSelectedProcedures] = useState(preSelectedProcedures);
  const [searchQuery, setSearchQuery] = useState('');

  // Build procedure list: every treatment that has an icdCode/icdUri AND whose
  // group matches one of the selected treatment groups — these are the ICD-11 imports.
  const procedures = useMemo(() => {
    const groups = new Set(
      selectedTreatments.map((t) => (t.group || t.category || '').toLowerCase())
    );
    const titleSet = new Set(
      selectedTreatments.map((t) => (t.title || '').toLowerCase())
    );

    return allTreatments.filter((t) => {
      // Must be an ICD-11 record (has a code or uri)
      const isIcd = !!(t.icdCode || t.icdUri || t.procedureCode);
      if (!isIcd) return false;

      // Must belong to the same specialty group as a selected treatment
      const tGroup = (t.group || t.category || '').toLowerCase();
      const tTitle = (t.title || '').toLowerCase();
      const groupMatch = groups.has(tGroup);
      // Also include if title exactly matches a selected treatment title
      const titleMatch = titleSet.has(tTitle);

      return groupMatch || titleMatch;
    });
  }, [allTreatments, selectedTreatments]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return procedures;
    return procedures.filter((p) =>
      `${p.title} ${p.icdCode} ${p.group} ${p.description || ''}`.toLowerCase().includes(q)
    );
  }, [procedures, searchQuery]);

  const toggle = (proc) => {
    setSelectedProcedures((prev) => {
      const exists = prev.find((p) => p.id === proc.id || p._id === proc._id);
      if (exists) return prev.filter((p) => p.id !== proc.id && p._id !== proc._id);
      return [...prev, proc];
    });
  };

  const isSelected = (proc) =>
    selectedProcedures.some((p) => p.id === proc.id || p._id === proc._id);

  const handleContinue = () => {
    // Allow continuing even with 0 selected (user may skip procedure selection)
    onContinue(selectedProcedures);
  };

  return (
    <div className="procedure-select-page">
      <PlannerStepsBar currentStep={plannerStep} />

      {/* Header */}
      <div className="procedure-select-header">
        <button className="back-btn" onClick={onBack} type="button">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          Back
        </button>
        <div className="procedure-select-header-content">
          <h1>Select Specific Procedure</h1>
          <p>
            Choose the exact procedure from our ICD-11 catalog — or skip to browse
            hospitals by treatment category.
          </p>
        </div>
      </div>

      {/* Selected treatments summary */}
      <div className="procedure-treatments-summary">
        <span className="summary-label">For:</span>
        {selectedTreatments.map((t) => (
          <span key={t.id || t._id} className="treatment-badge">
            {getPlannerTreatmentTitle(t)}
          </span>
        ))}
      </div>

      {/* Search bar */}
      {procedures.length > 0 && (
        <div className="procedure-search-bar-wrapper">
          <div className="planner-search-bar">
            <i className="fa-solid fa-magnifying-glass search-icon" aria-hidden="true" />
            <input
              type="text"
              className="planner-search-input"
              placeholder="Search procedures, ICD codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                type="button"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Procedure grid */}
      <div className="procedure-grid">
        {procedures.length === 0 && (
          <div className="procedure-empty-state">
            <i className="fa-solid fa-flask-vial" aria-hidden="true" />
            <strong>No specific procedures imported yet</strong>
            <p>
              Your admin can import detailed ICD-11 procedures for{' '}
              {selectedTreatments.map((t) => t.group || t.title).join(', ')}.
              You can still continue to find matching hospitals.
            </p>
          </div>
        )}

        {filtered.length === 0 && procedures.length > 0 && (
          <div className="procedure-empty-state">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <strong>No procedures match "{searchQuery}"</strong>
            <p>Try a different keyword or ICD code.</p>
          </div>
        )}

        {filtered.map((proc) => {
          const selected = isSelected(proc);
          const hasCost = proc.packageFrom && proc.packageFrom > 0;
          const iconClass = getProcedureIconClass(proc);
          return (
            <article
              key={proc.id || proc._id}
              className={`procedure-card${selected ? ' selected' : ''}`}
              onClick={() => toggle(proc)}
            >
              {/* ICD code badge - HIDDEN */}
              {/* {proc.icdCode && (
                <span className="procedure-icd-badge">
                  <i className="fa-solid fa-tag" aria-hidden="true" /> {proc.icdCode}
                </span>
              )} */}

              {/* Icon */}
              <div className="procedure-card-icon">
                <i className={`fa-solid ${iconClass}`} aria-hidden="true" />
              </div>

              <div className="procedure-card-body">
                <h3 className="procedure-card-title">{getPlannerTreatmentTitle(proc)}</h3>
                <span className="procedure-category-badge">{proc.group || proc.category}</span>

                {proc.description && (
                  <p className="procedure-card-desc">
                    {proc.description.length > 100
                      ? `${proc.description.slice(0, 97)}...`
                      : proc.description}
                  </p>
                )}

                {hasCost && (
                  <div className="procedure-cost">
                    <i className="fa-solid fa-indian-rupee-sign" aria-hidden="true" />
                    From ₹{(proc.packageFrom / 100000).toFixed(1)}L
                  </div>
                )}

                {/* WHO ICD-11 Link - HIDDEN */}
                {/* {proc.icdBrowserUrl && (
                  <a
                    href={proc.icdBrowserUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="procedure-who-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
                    WHO ICD-11
                  </a>
                )} */}
              </div>

              <div className="procedure-card-check">
                {selected ? (
                  <i className="fa-solid fa-circle-check" aria-hidden="true" />
                ) : (
                  <i className="fa-regular fa-circle" aria-hidden="true" />
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Standardized Sticky Footer — Step 2 */}
      <div className="planner-step-footer visible">
        <div className="planner-step-footer-inner">
          <div className="planner-step-footer-summary">
            {selectedProcedures.length > 0 ? (
              <>
                <i className="fa-solid fa-circle-check" aria-hidden="true" style={{color:'#22c55e'}} />
                <span><strong>{selectedProcedures.length}</strong> procedure{selectedProcedures.length > 1 ? 's' : ''} selected</span>
                <div className="footer-pills">
                  {selectedProcedures.slice(0, 2).map((p) => (
                    <span key={p.id || p._id} className="footer-pill">{getPlannerTreatmentTitle(p)}</span>
                  ))}
                  {selectedProcedures.length > 2 && <span className="footer-pill-more">+{selectedProcedures.length - 2}</span>}
                </div>
              </>
            ) : (
              <span className="footer-hint">
                <i className="fa-solid fa-circle-info" aria-hidden="true" />
                Select a specific procedure or skip to browse by treatment
              </span>
            )}
          </div>
          <button className="planner-footer-btn" onClick={handleContinue} type="button">
            {selectedProcedures.length > 0 ? (
              <><span>Continue</span><i className="fa-solid fa-arrow-right" aria-hidden="true" /></>
            ) : (
              <><span>Skip &amp; Continue</span><i className="fa-solid fa-arrow-right" aria-hidden="true" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse International Patient Wing details from text
function parseInternationalWing(text) {
  if (!text || text === 'yes' || text === 'no') return null;
  
  // Extract coordinators from text like: "Mrs. Sindu Deepa (Ortho), Mobile : +91 9003822877 Email : orthointernational@gangahospital.net"
  const coordinators = [];
  
  // Split by common delimiters
  const parts = text.split(/\/|\n/);
  
  parts.forEach(part => {
    const nameMatch = part.match(/([A-Z][a-z]+\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    const specialtyMatch = part.match(/\(([^)]+)\)/);
    const mobileMatch = part.match(/(?:Mobile|Mob|Phone|Ph)\s*:?\s*([\d\s+()-]+)/i);
    const emailMatch = part.match(/(?:Email|E-mail)\s*:?\s*([\w.+-]+@[\w.-]+\.\w+)/i);
    
    if (nameMatch || mobileMatch || emailMatch) {
      coordinators.push({
        name: nameMatch ? nameMatch[1].trim() : 'International Patient Coordinator',
        specialty: specialtyMatch ? specialtyMatch[1].trim() : '',
        mobile: mobileMatch ? mobileMatch[1].trim() : '',
        email: emailMatch ? emailMatch[1].trim().toLowerCase() : '',
      });
    }
  });
  
  return coordinators.length > 0 ? coordinators : null;
}

// Trip Style Selection Page Component
export function TripStylePage({ 
  onContinueToHospitals, 
  onBackToTreatments,
  selectedTreatments = [],
  plannerStep = 3,
}) {
  const [selectedStyle, setSelectedStyle] = useState(null);

  // Track trip style step
  useEffect(() => {
    const trackStep = async () => {
      try {
        await fetch('/api/leads/update', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step: 'trip_style_view',
            data: {
              selectedTreatments: selectedTreatments.map(t => t.title)
            }
          })
        });
      } catch (error) {
        console.log('Lead tracking failed:', error);
      }
    };
    
    trackStep();
  }, [selectedTreatments]);

  const tripStyles = [
    {
      id: 'budget',
      icon: 'fa-piggy-bank',
      title: 'Big Savings',
      description: 'Smart budget choices for affordable medical travel without compromising quality.'
    },
    {
      id: 'premium',
      icon: 'fa-crown',
      title: 'Premium Experience',
      description: 'Enjoy private recovery suites, concierge services, and luxury amenities for a premium stay.'
    },
    {
      id: 'medical-vacation',
      icon: 'fa-umbrella-beach',
      title: 'Medical + Vacation',
      description: 'A balanced experience combining top medical care with tourism and leisure activities.'
    },
    {
      id: 'wellness',
      icon: 'fa-spa',
      title: 'Wellness Retreat',
      description: 'Focus on holistic healing with spa treatments, yoga, and natural therapies.'
    },
    {
      id: 'fast-track',
      icon: 'fa-clock',
      title: 'Fast-Track Recovery',
      description: 'Minimal hospital stay and quick return home for those seeking efficient recovery.'
    },
    {
      id: 'family',
      icon: 'fa-users',
      title: 'Family Accompanied',
      description: 'Includes space and support for family members accompanying the patient.'
    }
  ];

  const handleContinue = async () => {
    if (selectedStyle && onContinueToHospitals) {
      // Track trip style selection
      try {
        await fetch('/api/leads/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step: 'trip_style_selected',
            data: {
              selectedTripStyle: selectedStyle,
              selectedTreatments: selectedTreatments.map(t => t.title)
            }
          })
        });
      } catch (error) {
        console.log('Lead tracking failed:', error);
      }
      
      onContinueToHospitals(selectedStyle);
    }
  };

  return (
    <div className="trip-style-page">
      <PlannerStepsBar currentStep={plannerStep} />

      {/* Header */}
      <div className="trip-style-header">
        <button className="back-btn" onClick={onBackToTreatments} type="button">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          Back to Treatments
        </button>
        <div className="trip-style-header-content">
          <h1>Select Trip Style</h1>
          <p>Choose your preferred medical travel experience based on your needs and budget</p>
        </div>
      </div>

      {/* Selected Treatments Summary */}
      <div className="trip-style-selected-treatments">
        <strong>Selected Treatments:</strong>
        <div className="treatments-summary">
          {selectedTreatments.map((treatment) => (
            <span key={treatment.id} className="treatment-badge">
              {treatment.title}
            </span>
          ))}
        </div>
      </div>

      {/* Trip Style Grid */}
      <div className="trip-styles-grid">
        {tripStyles.map((style) => (
          <article
            key={style.id}
            className={selectedStyle?.id === style.id ? 'trip-style-card selected' : 'trip-style-card'}
            onClick={() => setSelectedStyle(style)}
          >
            <div className="trip-style-icon">
              <i className={`fa-solid ${style.icon}`} aria-hidden="true" />
            </div>
            <h3>{style.title}</h3>
            <p>{style.description}</p>
            <div className="trip-style-check">
              {selectedStyle?.id === style.id ? (
                <i className="fa-solid fa-circle-check" aria-hidden="true" />
              ) : (
                <i className="fa-regular fa-circle" aria-hidden="true" />
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Standardized Sticky Footer — Step 3 */}
      <div className={`planner-step-footer${selectedStyle ? ' visible' : ''}`}>
        <div className="planner-step-footer-inner">
          <div className="planner-step-footer-summary">
            {selectedStyle ? (
              <>
                <i className="fa-solid fa-circle-check" aria-hidden="true" style={{color:'#22c55e'}} />
                <span><strong>{selectedStyle.title}</strong> selected</span>
                <div className="footer-pills">
                  <span className="footer-pill">
                    <i className={`fa-solid ${selectedStyle.icon}`} aria-hidden="true" /> {selectedStyle.title}
                  </span>
                </div>
              </>
            ) : (
              <span className="footer-hint">
                <i className="fa-solid fa-hand-pointer" aria-hidden="true" /> Choose a trip style to continue
              </span>
            )}
          </div>
          <button
            className="planner-footer-btn"
            onClick={handleContinue}
            disabled={!selectedStyle}
            type="button"
          >
            <span>Find Hospitals</span>
            <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Email OTP Login Modal Component
function EmailLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage('Please enter your email address');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // For development - Mock OTP system since backend is not ready
      // TODO: Replace with actual API call when backend is implemented
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if email is valid format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setMessage('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Mock successful OTP send
      setStep('otp');
      setMessage('OTP sent to your email. Use 123456 for testing.');
      
      // Track OTP request (will work when backend is ready)
      try {
        fetch('/api/leads/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step: 'otp_requested',
            data: { email: email.trim() }
          })
        }).catch(() => {}); // Silent fail for now
      } catch (e) {}
      
    } catch (error) {
      console.error('OTP Send Error:', error);
      setMessage('Mock OTP system: Use any valid email and OTP 123456');
      setStep('otp'); // Allow progression for demo
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setMessage('Please enter the OTP');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Mock OTP verification since backend is not ready
      // Use 123456 as the mock OTP for testing
      if (otp.trim() === '123456') {
        // Mock successful verification
        const mockToken = `mock-token-${Date.now()}`;
        const mockUser = { email: email.trim(), name: 'Test User' };
        
        // Save user session
        localStorage.setItem('userToken', mockToken);
        localStorage.setItem('userEmail', email.trim());
        
        // Track successful login (will fail silently since API not ready)
        try {
          fetch('/api/leads/update', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${mockToken}`
            },
            body: JSON.stringify({
              step: 'login_successful',
              data: { email: email.trim() }
            })
          }).catch(() => {}); // Silent fail for demo
        } catch (e) {}

        setMessage('Login successful! Unlocking hospitals...');
        setTimeout(() => {
          onLoginSuccess(mockUser);
          onClose();
        }, 1000);
      } else {
        setMessage('Invalid OTP. Please use 123456 for testing.');
      }
    } catch (error) {
      console.error('OTP Verify Error:', error);
      setMessage('Mock OTP system: Please use 123456 as OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setMessage('');
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="login-modal-header">
          <h3>
            <i className="fa-solid fa-unlock" aria-hidden="true" />
            Unlock Hospital Details
          </h3>
          <button className="close-btn" onClick={onClose} type="button">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="login-modal-body">
          <p>Sign in to view detailed hospital information, pricing, and book appointments.</p>

          {step === 'email' && (
            <form onSubmit={sendOTP}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                  required
                />
              </div>
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={verifyOTP}>
              <div className="form-group">
                <label>Enter OTP sent to {email}</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  disabled={loading}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="secondary-btn" onClick={resetModal}>
                  Change Email
                </button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </div>
            </form>
          )}

          {message && (
            <div className={`login-message ${message.includes('successful') || message.includes('sent') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Journey Planning Page Component - Complete Travel Planner
export function JourneyPlanningPage({ 
  selectedTreatments = [], 
  selectedHospital,
  onBack,
  onCompleteJourney,
  plannerStep = 5,
}) {
  const [userLocation, setUserLocation] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedAirport, setSelectedAirport] = useState('');
  const [customAirport, setCustomAirport] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showAirportDropdown, setShowAirportDropdown] = useState(false);
  const [travelMode, setTravelMode] = useState('flight');
  const [hotelCategory, setHotelCategory] = useState('3star');
  const [stayDuration, setStayDuration] = useState(7);
  const [companionCount, setCompanionCount] = useState(0);
  const [journeyPlan, setJourneyPlan] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  // Airport data by country and state
  const airportData = {
    'India': {
      'Delhi': [
        { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi' },
      ],
      'Maharashtra': [
        { code: 'BOM', name: 'Chhatrapati Shivaji International Airport', city: 'Mumbai' },
        { code: 'PNQ', name: 'Pune Airport', city: 'Pune' },
      ],
      'Karnataka': [
        { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bangalore' },
      ],
      'Tamil Nadu': [
        { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai' },
        { code: 'CJB', name: 'Coimbatore International Airport', city: 'Coimbatore' },
      ],
      'Telangana': [
        { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad' },
      ],
      'West Bengal': [
        { code: 'CCU', name: 'Netaji Subhas Chandra Bose International Airport', city: 'Kolkata' },
      ],
      'Kerala': [
        { code: 'COK', name: 'Cochin International Airport', city: 'Kochi' },
        { code: 'TRV', name: 'Trivandrum International Airport', city: 'Trivandrum' },
      ],
      'Gujarat': [
        { code: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad' },
      ],
      'Rajasthan': [
        { code: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur' },
      ],
      'Punjab': [
        { code: 'ATQ', name: 'Sri Guru Ram Dass Jee International Airport', city: 'Amritsar' },
      ]
    },
    'USA': {
      'California': [
        { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles' },
        { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco' },
      ],
      'New York': [
        { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York' },
        { code: 'LGA', name: 'LaGuardia Airport', city: 'New York' },
      ],
      'Texas': [
        { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas' },
        { code: 'IAH', name: 'George Bush Intercontinental Airport', city: 'Houston' },
      ]
    },
    'UK': {
      'England': [
        { code: 'LHR', name: 'Heathrow Airport', city: 'London' },
        { code: 'LGW', name: 'Gatwick Airport', city: 'London' },
        { code: 'MAN', name: 'Manchester Airport', city: 'Manchester' },
      ]
    },
    'Canada': {
      'Ontario': [
        { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto' },
      ],
      'British Columbia': [
        { code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver' },
      ]
    }
  };

  const countries = Object.keys(airportData);
  const states = selectedCountry ? Object.keys(airportData[selectedCountry] || {}) : [];
  const airports = (selectedCountry && selectedState) ? (airportData[selectedCountry][selectedState] || []) : [];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-dropdown-wrapper')) {
        setShowCountryDropdown(false);
        setShowStateDropdown(false);
        setShowAirportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get user email from localStorage
  useEffect(() => {
    const email = localStorage.getItem('userEmail') || '';
    const name = localStorage.getItem('userName') || '';
    setUserEmail(email);
    setUserName(name);
  }, []);

  // Dummy travel data for calculation
  const travelCosts = {
    flight: { base: 25000, perKm: 8 }
  };

  const hotelCosts = {
    none: 0,
    '2star': 2500,
    '3star': 4500,
    '4star': 7500,
    '5star': 15000
  };

  const calculateJourney = async () => {
    if (!userLocation.trim() && !selectedAirport && !customAirport.trim()) {
      alert('Please select your location and nearest airport');
      return;
    }
    
    if (!userName.trim()) {
      alert('Please enter patient name');
      return;
    }
    
    if (!userEmail.trim()) {
      alert('Please enter email address');
      return;
    }

    setIsCalculating(true);

    // Simulate calculation delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Dummy distance calculation (in real app, use Google Maps API)
    const estimatedDistance = Math.floor(Math.random() * 1500) + 200; // 200-1700 km
    
    // Calculate costs
    const travelCost = travelCosts[travelMode].base + (estimatedDistance * travelCosts[travelMode].perKm);
    const hotelCostPerNight = hotelCosts[hotelCategory];
    const totalHotelCost = hotelCategory === 'none' ? 0 : hotelCostPerNight * stayDuration;
    const companionCost = companionCount * (travelCost * 0.8 + totalHotelCost * 0.5);
    
    // Treatment costs from selected treatments
    const treatmentCost = selectedTreatments.reduce((sum, t) => sum + (t.packageFrom || 250000), 0);
    
    // Additional costs
    const visaCost = 2500;
    const localTransportCost = stayDuration * 500;
    const mealsCost = stayDuration * 1500 * (1 + companionCount);
    
    const totalCost = treatmentCost + travelCost + totalHotelCost + companionCost + 
                     visaCost + localTransportCost + mealsCost;

    const plan = {
      userLocation,
      hospitalLocation: `${selectedHospital.city}, ${selectedHospital.country}`,
      distance: estimatedDistance,
      travelMode,
      hotelCategory,
      stayDuration,
      companionCount,
      patientName: userName,
      patientEmail: userEmail,
      costs: {
        treatment: treatmentCost,
        travel: Math.round(travelCost),
        hotel: totalHotelCost,
        companion: Math.round(companionCost),
        visa: visaCost,
        localTransport: localTransportCost,
        meals: mealsCost,
        total: Math.round(totalCost)
      },
      route: {
        departure: userLocation,
        destination: `${selectedHospital.city}, ${selectedHospital.country}`,
        travelTime: '2-4 hours'
      },
      recommendations: {
        hotels: [
          `${hotelCategory.charAt(0).toUpperCase() + hotelCategory.slice(1)} hotels near ${selectedHospital.name}`,
          `Patient-friendly accommodations with medical facilities`,
          `24/7 room service and wheelchair accessibility`
        ],
        tips: [
          'Book flights 2-3 weeks in advance for better rates',
          'Carry all medical documents and prescriptions',
          'Inform hospital about your arrival date and time',
          'Consider travel insurance for medical emergencies'
        ]
      }
    };

    setJourneyPlan(plan);
    setIsCalculating(false);

    // Save to admin dashboard
    try {
      await fetch('/api/admin/journey-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail,
          userName: userName,
          selectedHospital: selectedHospital.name,
          selectedTreatments: selectedTreatments.map(t => t.title),
          journeyPlan: plan,
          icdCodes: selectedTreatments.map(t => t.icdCode).filter(Boolean),
          createdAt: new Date().toISOString()
        })
      });
    } catch (error) {
      console.log('Journey plan save failed:', error);
    }
  };

  return (
    <div className="journey-planning-page">
      <PlannerStepsBar currentStep={plannerStep} />

      {/* Header */}
      <div className="journey-planning-header">
        <button className="back-btn" onClick={onBack} type="button">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          Back to Hospitals
        </button>
        <div className="journey-planning-header-content">
          <h1>Plan Your Medical Journey</h1>
          <p>Complete travel planning - flights, hotels, route optimization, and cost estimation</p>
        </div>
      </div>

      <div className="journey-planning-content">
        {/* Planning Form - Left Side */}
        <div className="journey-planning-form">
          <h2>Travel Planning Details</h2>
          
          <div className="form-section">
            <h3><i className="fa-solid fa-user" aria-hidden="true"></i> Patient Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Patient Name *</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter patient full name"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="form-input"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  placeholder="Enter age"
                  className="form-input"
                  min="1"
                  max="120"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3><i className="fa-solid fa-location-dot" aria-hidden="true"></i> Location & Airport Details</h3>
            
            <div className="form-group">
              <label>Country</label>
              <div className="custom-dropdown-wrapper">
                <div 
                  className={`custom-dropdown ${showCountryDropdown ? 'active' : ''}`}
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                >
                  <span className="dropdown-selected">
                    {selectedCountry || 'Select Country'}
                  </span>
                  <i className={`fa-solid fa-chevron-down dropdown-arrow ${showCountryDropdown ? 'rotated' : ''}`} aria-hidden="true"></i>
                </div>
                {showCountryDropdown && (
                  <div className="custom-dropdown-options">
                    {countries.map(country => (
                      <div 
                        key={country} 
                        className="dropdown-option"
                        onClick={() => {
                          setSelectedCountry(country);
                          setSelectedState('');
                          setSelectedAirport('');
                          setCustomAirport('');
                          setShowCountryDropdown(false);
                        }}
                      >
                        <span className="country-flag">
                          {country === 'India' ? '🇮🇳' : 
                           country === 'USA' ? '🇺🇸' : 
                           country === 'UK' ? '🇬🇧' : 
                           country === 'Canada' ? '🇨🇦' : '🌍'}
                        </span>
                        {country}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedCountry && (
              <div className="form-group">
                <label>State/Province</label>
                <div className="custom-dropdown-wrapper">
                  <div 
                    className={`custom-dropdown ${showStateDropdown ? 'active' : ''}`}
                    onClick={() => setShowStateDropdown(!showStateDropdown)}
                  >
                    <span className="dropdown-selected">
                      {selectedState || 'Select State/Province'}
                    </span>
                    <i className={`fa-solid fa-chevron-down dropdown-arrow ${showStateDropdown ? 'rotated' : ''}`} aria-hidden="true"></i>
                  </div>
                  {showStateDropdown && (
                    <div className="custom-dropdown-options">
                      {states.map(state => (
                        <div 
                          key={state} 
                          className="dropdown-option"
                          onClick={() => {
                            setSelectedState(state);
                            setSelectedAirport('');
                            setCustomAirport('');
                            setShowStateDropdown(false);
                          }}
                        >
                          <i className="fa-solid fa-map-marker-alt" aria-hidden="true"></i>
                          {state}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedCountry && selectedState && (
              <div className="form-group">
                <label>Nearest Airport</label>
                <div className="custom-dropdown-wrapper">
                  <div 
                    className={`custom-dropdown ${showAirportDropdown ? 'active' : ''}`}
                    onClick={() => setShowAirportDropdown(!showAirportDropdown)}
                  >
                    <span className="dropdown-selected">
                      {selectedAirport && selectedAirport !== 'custom'
                        ? `${selectedAirport} - ${airports.find(a => a.code === selectedAirport)?.name}`
                        : selectedAirport === 'custom'
                        ? 'Custom Airport'
                        : 'Select Airport'
                      }
                    </span>
                    <i className={`fa-solid fa-chevron-down dropdown-arrow ${showAirportDropdown ? 'rotated' : ''}`} aria-hidden="true"></i>
                  </div>
                  {showAirportDropdown && (
                    <div className="custom-dropdown-options">
                      {airports.map(airport => (
                        <div 
                          key={airport.code} 
                          className="dropdown-option"
                          onClick={() => {
                            setSelectedAirport(airport.code);
                            setCustomAirport('');
                            setUserLocation(`${airport.city}, ${selectedState}, ${selectedCountry}`);
                            setShowAirportDropdown(false);
                          }}
                        >
                          <i className="fa-solid fa-plane" aria-hidden="true"></i>
                          <div className="airport-info">
                            <strong>{airport.code}</strong>
                            <small>{airport.name}</small>
                            <span className="airport-city">{airport.city}</span>
                          </div>
                        </div>
                      ))}
                      <div 
                        className="dropdown-option custom-option"
                        onClick={() => {
                          setSelectedAirport('custom');
                          setUserLocation('');
                          setShowAirportDropdown(false);
                        }}
                      >
                        <i className="fa-solid fa-plus" aria-hidden="true"></i>
                        Add Custom Airport
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(selectedAirport === 'custom' || (!selectedCountry && !selectedState)) && (
              <div className="form-group">
                <label>
                  {selectedAirport === 'custom' ? 'Custom Airport Details' : 'Manual Location Entry'}
                </label>
                <input
                  type="text"
                  value={customAirport || userLocation}
                  onChange={(e) => {
                    if (selectedAirport === 'custom') {
                      setCustomAirport(e.target.value);
                      setUserLocation(e.target.value);
                    } else {
                      setUserLocation(e.target.value);
                    }
                  }}
                  placeholder={selectedAirport === 'custom' ? "Enter airport code and details (e.g., JFK - John F Kennedy Airport, New York)" : "Enter your city, state, country"}
                  className="form-input"
                />
              </div>
            )}
          </div>

          <div className="form-section">
            <h3><i className="fa-solid fa-plane" aria-hidden="true"></i> Travel Preferences</h3>
            <div className="form-group">
              <label>Preferred Travel Mode</label>
              <div className="travel-mode-cards">
                {[
                  { id: 'flight', label: 'Flight', icon: 'fa-plane', desc: 'Fastest option' }
                ].map(mode => (
                  <div key={mode.id} className={`travel-mode-card ${travelMode === mode.id ? 'selected' : ''}`} onClick={() => setTravelMode(mode.id)}>
                    <input
                      type="radio"
                      name="travelMode"
                      value={mode.id}
                      checked={travelMode === mode.id}
                      onChange={(e) => setTravelMode(e.target.value)}
                      className="travel-mode-radio"
                    />
                    <div className="travel-mode-content">
                      <div className="travel-mode-header">
                        <i className={`fa-solid ${mode.icon}`} aria-hidden="true"></i>
                        <strong>{mode.label}</strong>
                      </div>
                      <small>{mode.desc}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3><i className="fa-solid fa-bed" aria-hidden="true"></i> Accommodation</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Hotel Category</label>
                <div className="custom-select-wrapper">
                  <select 
                    value={hotelCategory} 
                    onChange={(e) => setHotelCategory(e.target.value)}
                    className="custom-select"
                  >
                    <option value="none">No Hotel Required</option>
                    <option value="2star">2 Star Hotel - ₹2,500/night</option>
                    <option value="3star">3 Star Hotel - ₹4,500/night</option>
                    <option value="4star">4 Star Hotel - ₹7,500/night</option>
                    <option value="5star">5 Star Hotel - ₹15,000/night</option>
                  </select>
                  <i className="fa-solid fa-chevron-down select-arrow" aria-hidden="true"></i>
                </div>
              </div>
              <div className="form-group">
                <label>Stay Duration</label>
                <div className="custom-select-wrapper">
                  <select 
                    value={stayDuration} 
                    onChange={(e) => setStayDuration(Number(e.target.value))}
                    className="custom-select"
                  >
                    <option value={3}>3 Days</option>
                    <option value={5}>5 Days</option>
                    <option value={7}>7 Days (Recommended)</option>
                    <option value={10}>10 Days</option>
                    <option value={14}>14 Days</option>
                  </select>
                  <i className="fa-solid fa-chevron-down select-arrow" aria-hidden="true"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3><i className="fa-solid fa-users" aria-hidden="true"></i> Companions</h3>
            <div className="form-group">
              <label>Number of Companions</label>
              <div className="custom-select-wrapper">
                <select 
                  value={companionCount} 
                  onChange={(e) => setCompanionCount(Number(e.target.value))}
                  className="custom-select"
                >
                  <option value={0}>Traveling Alone</option>
                  <option value={1}>1 Companion</option>
                  <option value={2}>2 Companions</option>
                  <option value={3}>3 Companions</option>
                </select>
                <i className="fa-solid fa-chevron-down select-arrow" aria-hidden="true"></i>
              </div>
            </div>
          </div>

          <button 
            className="calculate-journey-btn"
            onClick={calculateJourney}
            disabled={isCalculating || !userLocation.trim()}
            type="button"
          >
            {isCalculating ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
                Calculating Journey...
              </>
            ) : (
              <>
                <i className="fa-solid fa-calculator" aria-hidden="true" />
                Get a Estimated Plan
              </>
            )}
          </button>
        </div>

        {/* Summary Sidebar - Right Side */}
        <div className="journey-planning-sidebar">
          {/* Selected Hospital Summary */}
          <div className="sidebar-section">
            <h3><i className="fa-solid fa-hospital" aria-hidden="true"></i> Selected Hospital</h3>
            <div className="hospital-summary-card">
              <div className="hospital-image-container">
                <img 
                  src={selectedHospital.image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80'} 
                  alt={selectedHospital.name}
                  className="hospital-summary-image"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                <div className="hospital-image-overlay">
                  {selectedHospital.jciAccredited ? (
                    <span className="accreditation-badge jci">
                      <img src="https://cdn.prod.website-files.com/63dc099d352018653241b1a7/63fe8bab2259ca569b27dcdf_gold-seal-approval.png" alt="JCI" />
                      JCI
                    </span>
                  ) : (
                    <span className="accreditation-badge nabh">
                      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQntV_tAgbdUJrZpcCIbKGbqdoM9GaOgerg3Q" alt="NABH" />
                      NABH
                    </span>
                  )}
                </div>
              </div>
              <div className="hospital-summary-content">
                <div className="hospital-summary-header">
                  <strong>{selectedHospital.name}</strong>
                  <div className="hospital-rating">
                    <span className="rating-stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i key={i} className="fa-solid fa-star" aria-hidden="true" />
                      ))}
                    </span>
                    <span>{selectedHospital.rating || 4.8}</span>
                  </div>
                </div>
                <span className="hospital-location">
                  <i className="fa-solid fa-location-dot" aria-hidden="true" />
                  {selectedHospital.city}, {selectedHospital.country}
                </span>
              </div>
            </div>
          </div>

          {/* Selected Treatments Summary */}
          <div className="sidebar-section">
            <h3><i className="fa-solid fa-stethoscope" aria-hidden="true"></i> Selected Treatments ({selectedTreatments.length})</h3>
            <div className="treatments-summary-list">
              {selectedTreatments.map((treatment) => (
                <div key={treatment.id} className="treatment-summary-item">
                  <div className="treatment-info">
                    <strong>{treatment.title}</strong>
                    {/* {treatment.icdCode && <small>ICD-11: {treatment.icdCode}</small>} */}
                    {treatment.packageFrom && (
                      <span className="treatment-cost">From ₹{(treatment.packageFrom / 100000).toFixed(1)}L</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info */}
          <div className="sidebar-section">
            <h3><i className="fa-solid fa-info-circle" aria-hidden="true"></i> Airport Details</h3>
            <div className="quick-info-list">
              <div className="info-item">
                <span className="info-label">Departure Airport:</span>
                <span className="info-value">
                  {selectedAirport && selectedAirport !== 'custom' 
                    ? `${selectedAirport} - ${airports.find(a => a.code === selectedAirport)?.name}`
                    : customAirport 
                    ? customAirport.split(' - ')[0] || customAirport
                    : userLocation || 'Not selected'
                  }
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Destination Airport:</span>
                <span className="info-value">{selectedHospital.city} Airport - {selectedHospital.city === 'New Delhi' ? 'IGI (DEL)' : selectedHospital.city === 'Mumbai' ? 'BOM' : selectedHospital.city === 'Chennai' ? 'MAA' : selectedHospital.city === 'Bangalore' ? 'BLR' : selectedHospital.city === 'Hyderabad' ? 'HYD' : selectedHospital.city === 'Gurgaon' ? 'IGI (DEL)' : 'Local Airport'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Journey Plan Success - Opens New Page */}
        {journeyPlan && (
          <div className="journey-plan-success">
            <div className="success-message">
              <i className="fa-solid fa-check-circle" aria-hidden="true"></i>
              <h3>Journey Plan Created Successfully!</h3>
              <p>Your complete medical travel plan has been calculated and saved.</p>
              <button 
                className="view-plan-btn"
                onClick={() => onCompleteJourney(journeyPlan)}
                type="button"
              >
                <i className="fa-solid fa-eye" aria-hidden="true" />
                View Complete Journey Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// New Journey Results Page Component - Modern Design
export function JourneyResultsPage({ 
  journeyPlan,
  selectedTreatments = [],
  selectedHospital,
  onBack,
  onConfirmJourney
}) {
  if (!journeyPlan) return null;

  return (
    <div className="journey-results-page">
      {/* Animated Header */}
      <div className="journey-results-header">
        <button className="modern-back-btn" onClick={onBack} type="button">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          Back to Planning
        </button>
        <div className="results-header-content">
          <div className="header-badge">
            <i className="fa-solid fa-check-circle" aria-hidden="true"></i>
            <span>Plan Ready</span>
          </div>
          <h1>Your Complete Journey Plan</h1>
          <p>Review your personalized medical travel plan and confirm your booking</p>
        </div>
      </div>

      <div className="results-main-content">
        {/* Patient & Journey Hero Section */}
        <div className="journey-hero-section">
          <div className="patient-journey-card">
            <div className="patient-info">
              <div className="patient-avatar">
                <i className="fa-solid fa-user-circle" aria-hidden="true"></i>
              </div>
              <div className="patient-details">
                <h3>{journeyPlan.patientName}</h3>
                <span>{journeyPlan.patientEmail}</span>
                <div className="journey-route-mini">
                  <span>{journeyPlan.userLocation}</span>
                  <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                  <span>{journeyPlan.hospitalLocation}</span>
                </div>
              </div>
            </div>
            <div className="journey-stats">
              <div className="stat-item">
                <i className="fa-solid fa-calendar-days" aria-hidden="true"></i>
                <span>{journeyPlan.stayDuration} Days</span>
              </div>
              <div className="stat-item">
                <i className="fa-solid fa-users" aria-hidden="true"></i>
                <span>{journeyPlan.companionCount + 1} Travelers</span>
              </div>
              <div className="stat-item">
                <i className="fa-solid fa-route" aria-hidden="true"></i>
                <span>{journeyPlan.distance} km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Route Visualization */}
        <div className="route-visualization-section">
          <h3><i className="fa-solid fa-map-marked-alt" aria-hidden="true"></i> Travel Route</h3>
          <div className="interactive-route">
            <div className="route-timeline">
              <div className="timeline-point departure">
                <div className="point-marker">
                  <i className="fa-solid fa-home" aria-hidden="true"></i>
                </div>
                <div className="point-info">
                  <strong>Departure</strong>
                  <span>{journeyPlan.userLocation}</span>
                  <small>Starting Point</small>
                </div>
              </div>
              
              <div className="timeline-line">
                <div className="travel-info">
                  <i className="fa-solid fa-plane" aria-hidden="true"></i>
                  <span>{journeyPlan.distance} km</span>
                  <small>{journeyPlan.route.travelTime}</small>
                </div>
              </div>
              
              <div className="timeline-point arrival">
                <div className="point-marker">
                  <i className="fa-solid fa-hospital" aria-hidden="true"></i>
                </div>
                <div className="point-info">
                  <strong>Arrival</strong>
                  <span>{selectedHospital.name}</span>
                  <small>{journeyPlan.hospitalLocation}</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Treatment & Hospital Cards */}
        <div className="treatment-hospital-section">
          <div className="selected-hospital-card">
            <div className="hospital-image-section">
              <img 
                src={selectedHospital.image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80'} 
                alt={selectedHospital.name}
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80';
                }}
              />
              <div className="hospital-overlay">
                <div className="hospital-rating">
                  <span className="rating-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i key={i} className="fa-solid fa-star" aria-hidden="true" />
                    ))}
                  </span>
                  <span>{selectedHospital.rating || 4.8}</span>
                </div>
              </div>
            </div>
            <div className="hospital-info-section">
              <h3>{selectedHospital.name}</h3>
              <p>{selectedHospital.city}, {selectedHospital.country}</p>
              <div className="hospital-features">
                <span className="feature-badge">
                  <i className="fa-solid fa-award" aria-hidden="true"></i>
                  {selectedHospital.jciAccredited ? 'JCI Accredited' : 'NABH Accredited'}
                </span>
                <span className="feature-badge">
                  <i className="fa-solid fa-bed" aria-hidden="true"></i>
                  {selectedHospital.beds || '400+'} Beds
                </span>
              </div>
            </div>
          </div>

          <div className="treatments-showcase">
            <h3><i className="fa-solid fa-stethoscope" aria-hidden="true"></i> Selected Treatments</h3>
            <div className="treatments-list">
              {selectedTreatments.map((treatment) => (
                <div key={treatment.id} className="treatment-showcase-item">
                  <div className="treatment-icon">
                    <i className="fa-solid fa-medical-kit" aria-hidden="true"></i>
                  </div>
                  <div className="treatment-details">
                    <strong>{treatment.title}</strong>
                    {/* {treatment.icdCode && <small>ICD-11: {treatment.icdCode}</small>} */}
                    <span className="treatment-category">{treatment.group || treatment.category}</span>
                  </div>
                  {treatment.packageFrom && (
                    <div className="treatment-cost">
                      ₹{treatment.packageFrom.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modern Cost Breakdown */}
        <div className="cost-breakdown-modern">
          <h3><i className="fa-solid fa-receipt" aria-hidden="true"></i> Cost Breakdown</h3>
          <div className="cost-cards-grid">
            <div className="cost-card primary">
              <div className="cost-header">
                <i className="fa-solid fa-stethoscope" aria-hidden="true"></i>
                <span>Medical Treatment</span>
              </div>
              <div className="cost-amount">₹{journeyPlan.costs.treatment.toLocaleString()}</div>
            </div>
            
            <div className="cost-card">
              <div className="cost-header">
                <i className="fa-solid fa-plane" aria-hidden="true"></i>
                <span>Travel ({journeyPlan.travelMode})</span>
              </div>
              <div className="cost-amount">₹{journeyPlan.costs.travel.toLocaleString()}</div>
            </div>
            
            {journeyPlan.costs.hotel > 0 && (
              <div className="cost-card">
                <div className="cost-header">
                  <i className="fa-solid fa-bed" aria-hidden="true"></i>
                  <span>Hotel ({journeyPlan.stayDuration} nights)</span>
                </div>
                <div className="cost-amount">₹{journeyPlan.costs.hotel.toLocaleString()}</div>
              </div>
            )}
            
            {journeyPlan.companionCount > 0 && (
              <div className="cost-card">
                <div className="cost-header">
                  <i className="fa-solid fa-users" aria-hidden="true"></i>
                  <span>Companions ({journeyPlan.companionCount})</span>
                </div>
                <div className="cost-amount">₹{journeyPlan.costs.companion.toLocaleString()}</div>
              </div>
            )}
            
            <div className="cost-card">
              <div className="cost-header">
                <i className="fa-solid fa-passport" aria-hidden="true"></i>
                <span>Visa & Documents</span>
              </div>
              <div className="cost-amount">₹{journeyPlan.costs.visa.toLocaleString()}</div>
            </div>
            
            <div className="cost-card">
              <div className="cost-header">
                <i className="fa-solid fa-utensils" aria-hidden="true"></i>
                <span>Meals & Transport</span>
              </div>
              <div className="cost-amount">₹{(journeyPlan.costs.localTransport + journeyPlan.costs.meals).toLocaleString()}</div>
            </div>
          </div>
          
          <div className="total-cost-banner">
            <div className="total-content">
              <span>Total Estimated Cost</span>
              <div className="total-amount">₹{journeyPlan.costs.total.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Smart Recommendations */}
        <div className="smart-recommendations">
          <div className="recommendation-card">
            <h3><i className="fa-solid fa-lightbulb" aria-hidden="true"></i> Smart Travel Tips</h3>
            <div className="tips-grid">
              {journeyPlan.recommendations.tips.map((tip, index) => (
                <div key={index} className="tip-item">
                  <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="recommendation-card">
            <h3><i className="fa-solid fa-bed" aria-hidden="true"></i> Accommodation Guide</h3>
            <div className="accommodation-list">
              {journeyPlan.recommendations.hotels.map((hotel, index) => (
                <div key={index} className="accommodation-item">
                  <i className="fa-solid fa-building" aria-hidden="true"></i>
                  <span>{hotel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final Confirmation Section */}
        <div className="confirmation-section">
          <div className="confirmation-card">
            <div className="confirmation-header">
              <i className="fa-solid fa-calendar-check" aria-hidden="true"></i>
              <h3>Ready to Confirm Your Journey?</h3>
              <p>Our travel coordinator will contact you within 24 hours to finalize all arrangements</p>
            </div>
            <div className="confirmation-benefits">
              <div className="benefit-item">
                <i className="fa-solid fa-shield-check" aria-hidden="true"></i>
                <span>Secure Booking</span>
              </div>
              <div className="benefit-item">
                <i className="fa-solid fa-headset" aria-hidden="true"></i>
                <span>24/7 Support</span>
              </div>
              <div className="benefit-item">
                <i className="fa-solid fa-medal" aria-hidden="true"></i>
                <span>Best Price Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Standardized Sticky Footer — Step 5 */}
      {journeyPlan && (
        <div className="planner-step-footer visible">
          <div className="planner-step-footer-inner">
            <div className="planner-step-footer-summary">
              <i className="fa-solid fa-circle-check" aria-hidden="true" style={{color:'#22c55e'}} />
              <span>Total estimate: <strong>₹{journeyPlan.costs.total.toLocaleString('en-IN')}</strong></span>
              <div className="footer-pills">
                <span className="footer-pill">
                  <i className="fa-solid fa-hospital" aria-hidden="true" /> {selectedHospital?.name}
                </span>
                <span className="footer-pill">
                  <i className="fa-solid fa-plane" aria-hidden="true" /> {journeyPlan.stayDuration} nights
                </span>
              </div>
            </div>
            <button
              className="planner-footer-btn"
              onClick={() => onConfirmJourney(journeyPlan)}
              type="button"
            >
              <i className="fa-solid fa-rocket" aria-hidden="true" />
              <span>Confirm &amp; Book</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export function PlannerHospitalsPage({ 
  selectedTreatments = [], 
  hospitals = [], 
  onBack,
  onSelectHospital,
  onViewHospitalDetails,
  formatCurrency,
  plannerStep = 4,
}) {
  const [cityFilter, setCityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('recommended');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [selectedHospitalForFooter, setSelectedHospitalForFooter] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const email = localStorage.getItem('userEmail');
    
    if (token && email) {
      setIsLoggedIn(true);
      setUserEmail(email);
    }

    // Track hospitals view
    fetch('/api/leads/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'hospitals_view',
        data: {
          selectedTreatments: selectedTreatments.map(t => t.title),
          isLoggedIn: !!token
        }
      })
    }).catch(console.log);
  }, [selectedTreatments]);

  const cities = useMemo(() => {
    return ['All', ...new Set(hospitals.map(h => h.city).filter(Boolean))];
  }, [hospitals]);

  const filteredHospitals = useMemo(() => {
    if (selectedTreatments.length === 0) {
      // If no treatments selected, show all hospitals
      return hospitals;
    }

    // Filter hospitals that match selected treatments
    const matchedHospitals = hospitals.filter(hospital => {
      const tags = Array.isArray(hospital.tags) ? hospital.tags : [];
      const hospitalSpecialty = hospital.specialty || '';
      const hospitalName = hospital.name || '';
      
      return selectedTreatments.some(treatment => {
        const treatmentTitle = treatment.title || '';
        const treatmentSpecialty = treatment.specialty || '';
        const treatmentGroup = treatment.group || treatment.category || '';
        
        // Match by exact treatment title in hospital tags
        if (tags.some(tag => tag.toLowerCase().includes(treatmentTitle.toLowerCase()))) {
          return true;
        }
        
        // Match by specialty
        if (hospitalSpecialty.toLowerCase().includes(treatmentSpecialty.toLowerCase()) || 
            treatmentSpecialty.toLowerCase().includes(hospitalSpecialty.toLowerCase())) {
          return true;
        }
        
        // Match by treatment group/category
        if (hospitalSpecialty.toLowerCase().includes(treatmentGroup.toLowerCase()) ||
            treatmentGroup.toLowerCase().includes(hospitalSpecialty.toLowerCase())) {
          return true;
        }
        
        // Match by keywords in hospital name for broad matching
        const treatmentKeywords = treatmentTitle.toLowerCase().split(' ');
        const hospitalKeywords = hospitalName.toLowerCase();
        if (treatmentKeywords.some(keyword => hospitalKeywords.includes(keyword) && keyword.length > 3)) {
          return true;
        }
        
        return false;
      });
    });

    // Remove duplicates by hospital ID
    const uniqueHospitals = [];
    const seenIds = new Set();
    
    matchedHospitals.forEach(hospital => {
      if (!seenIds.has(hospital.id)) {
        seenIds.add(hospital.id);
        uniqueHospitals.push(hospital);
      }
    });

    // If no exact matches found, show a subset of hospitals for fallback
    let filtered = uniqueHospitals.length > 0 ? uniqueHospitals : hospitals.slice(0, 6);

    // City filter
    if (cityFilter !== 'All') {
      filtered = filtered.filter(h => h.city === cityFilter);
    }

    // Sort
    if (sortBy === 'price-low') {
      filtered = filtered.sort((a, b) => (a.cost?.package || 0) - (b.cost?.package || 0));
    } else if (sortBy === 'price-high') {
      filtered = filtered.sort((a, b) => (b.cost?.package || 0) - (a.cost?.package || 0));
    } else if (sortBy === 'rating') {
      filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return filtered;
  }, [hospitals, selectedTreatments, cityFilter, sortBy]);

  const handleHospitalClick = (hospital) => {
    if (!isLoggedIn) {
      fetch('/api/leads/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'login_prompted',
          data: { hospitalName: hospital.name, selectedTreatments: selectedTreatments.map(t => t.title) }
        })
      }).catch(console.log);
      setShowLoginModal(true);
    } else {
      // Select hospital for footer CTA — don't navigate immediately
      setSelectedHospitalForFooter((prev) =>
        prev?.name === hospital.name ? null : hospital
      );
    }
  };

  const handleProceedToJourney = () => {
    if (selectedHospitalForFooter) {
      onSelectHospital(selectedHospitalForFooter);
    }
  };

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setUserEmail(user.email);
    setShowLoginModal(false);
  };

  return (
    <div className="planner-hospitals-page">
      <PlannerStepsBar currentStep={plannerStep} />

      {/* Header with Back Button */}
      <div className="hospitals-header">
        <button className="back-btn" onClick={onBack} type="button">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          Back to Trip Style
        </button>
        <div className="hospitals-header-info">
          <h1>Available Hospitals</h1>
          <p>{filteredHospitals.length} hospitals found for your selected treatments</p>
        </div>
      </div>

      {/* Selected Treatments Summary */}
      <div className="hospitals-selected-treatments">
        <strong>Selected Treatments:</strong>
        <div className="treatments-summary">
          {selectedTreatments.map((treatment) => (
            <span key={treatment.id} className="treatment-badge">
              {getPlannerTreatmentTitle(treatment)}
            </span>
          ))}
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="hospitals-filters">
        <div className="filter-group">
          <label>City:</label>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recommended">Recommended</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Hospitals List */}
      <div className="hospitals-results-grid">
        {filteredHospitals.length > 0 && selectedTreatments.length > 0 && (
          <div className="hospital-match-note">
            <i className="fa-solid fa-circle-check" aria-hidden="true" />
            Showing {filteredHospitals.length} hospitals that match your selected treatments.
          </div>
        )}
        {filteredHospitals.length > 0 && selectedTreatments.length > 0 && !hospitals.some(hospital => {
          const tags = Array.isArray(hospital.tags) ? hospital.tags : [];
          return selectedTreatments.some(treatment => tags.includes(treatment.title) || hospital.specialty === treatment.specialty);
        }) && (
          <div className="hospital-match-note">
            <i className="fa-solid fa-circle-info" aria-hidden="true" />
            Showing recommended hospitals while exact treatment mapping is updated.
          </div>
        )}
        {filteredHospitals.map((hospital) => {
          const internationalWing = parseInternationalWing(hospital.internationalPatientWing);
          
          return (
            <article
              key={hospital.id}
              className={`hospital-result-card${selectedHospitalForFooter?.name === hospital.name ? ' hospital-card-selected' : ''}`}
            >
              <div className="hospital-card-image">
                {hospital.image ? (
                  <img 
                    src={hospital.image} 
                    alt={hospital.name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <div 
                  className="hospital-image-placeholder" 
                  style={{display: hospital.image ? 'none' : 'block'}}
                >
                  Hospital Image
                </div>
              </div>
              
              <div className="hospital-card-content">
                <div className="hospital-accreditation-logos hospital-logo-top">
                  {hospital.jciAccredited ? (
                    <div className="accreditation-badge jci-badge">
                      <img src="https://cdn.prod.website-files.com/63dc099d352018653241b1a7/63fe8bab2259ca569b27dcdf_gold-seal-approval.png" alt="JCI Accredited" />
                      <span>JCI</span>
                    </div>
                  ) : (
                    <div className="accreditation-badge nabh-badge">
                      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQntV_tAgbdUJrZpcCIbKGbqdoM9GaOgerg3Q" alt="NABH Accredited" />
                      <span>NABH</span>
                    </div>
                  )}
                </div>
                
                <h3>
                  <button 
                    className="hospital-name-link"
                    onClick={() => onViewHospitalDetails && onViewHospitalDetails(hospital)}
                    type="button"
                  >
                    {hospital.name}
                  </button>
                </h3>
                
                <div className="hospital-rating">
                  <span className="rating-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i key={i} className="fa-solid fa-star" aria-hidden="true" />
                    ))}
                  </span>
                  <strong>{hospital.rating || 4.8}</strong>
                  <span className="hospital-rating-count">
                    {hospital.rating || 4.8} ({hospital.reviews || 1} Ratings)
                  </span>
                </div>
                
                <p>
                  {hospital.summary || `${hospital.name} is listed from the Client master data for multispeciality care in ${hospital.city}. Accreditation: ${hospital.accreditations || 'NABH'}`}
                </p>
                
                <a href="#" className="show-more-link">Show More</a>
              </div>
              
              <div className="hospital-card-sidebar">
                <div className="hospital-info-row">
                  <span className="hospital-info-label">Established:</span>
                  <span className="hospital-info-value">{hospital.established || hospital.foundedYear || 'Update pending'}</span>
                </div>
                <div className="hospital-info-row">
                  <span className="hospital-info-label">Beds:</span>
                  <span className="hospital-info-value">{hospital.beds || hospital.bedText || '400'}</span>
                </div>
                <div className="hospital-info-row">
                  <span className="hospital-info-label">JCI Accredited:</span>
                  <span className="hospital-info-value">{hospital.jciAccredited ? 'Yes' : 'NABH'}</span>
                </div>
                <div className="hospital-info-row">
                  <span className="hospital-info-label">Location:</span>
                  <span className="hospital-info-value">{hospital.city}</span>
                </div>
                
                <button 
                  className={`view-hospital-btn${selectedHospitalForFooter?.name === hospital.name ? ' selected' : ''}`}
                  onClick={() => handleHospitalClick(hospital)}
                  type="button"
                >
                  {selectedHospitalForFooter?.name === hospital.name
                    ? <><i className="fa-solid fa-circle-check" aria-hidden="true" /> Selected</>
                    : isLoggedIn ? 'Select Hospital' : 'Login to Select'
                  }
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {filteredHospitals.length === 0 && (
        <div className="no-results">
          <i className="fa-solid fa-hospital" aria-hidden="true" />
          <h3>No hospitals found</h3>
          <p>Try adjusting your filters or selecting different treatments</p>
        </div>
      )}

      {/* Login Modal */}
      <EmailLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Standardized Sticky Footer — Step 4 */}
      <div className={`planner-step-footer${selectedHospitalForFooter ? ' visible' : ''}`}>
        <div className="planner-step-footer-inner">
          <div className="planner-step-footer-summary">
            {selectedHospitalForFooter ? (
              <>
                <i className="fa-solid fa-circle-check" aria-hidden="true" style={{color:'#22c55e'}} />
                <span>Selected: <strong>{selectedHospitalForFooter.name}</strong></span>
                <div className="footer-pills">
                  <span className="footer-pill">
                    <i className="fa-solid fa-location-dot" aria-hidden="true" /> {selectedHospitalForFooter.city}
                  </span>
                  {selectedHospitalForFooter.specialty && (
                    <span className="footer-pill">{selectedHospitalForFooter.specialty}</span>
                  )}
                </div>
              </>
            ) : (
              <span className="footer-hint">
                <i className="fa-solid fa-hand-pointer" aria-hidden="true" /> Select a hospital to plan your journey
              </span>
            )}
          </div>
          <button
            className="planner-footer-btn"
            onClick={handleProceedToJourney}
            disabled={!selectedHospitalForFooter}
            type="button"
          >
            <span>Plan Journey</span>
            <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
