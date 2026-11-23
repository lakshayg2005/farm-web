import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/features/auth/authContext'
import { websiteRoles } from '@/features/auth/roles'
import { useI18n } from '@/i18n/i18n'
import { sectionByRole } from '@/routes/sections'

export function HomePage() {
  const notify = useToast()
  const { user } = useAuth()
  const { t } = useI18n()
  const roles = user ? websiteRoles(user) : []
  const [spotlightQty, setSpotlightQty] = useState(2)
  const navigate = useNavigate()

  return (
    <>
      <SiteHeader />
      <div>
    <div className="flex flex-col w-full relative overflow-hidden bg-background text-on-surface">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute top-[850px] -right-48 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[160px] pointer-events-none -z-10"></div>
      <div className="absolute top-[1800px] -left-48 w-[600px] h-[600px] bg-primary-container/10 rounded-full blur-[170px] pointer-events-none -z-10"></div>

      {roles.length > 0 && (
        <nav aria-label={t('Your workspaces')} className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-3 px-6 pt-8 lg:px-12">
          {roles.map((role, i) => (
            <Link
              key={role}
              to={`/${role}`}
              className={`${i === 0 ? 'btn-primary' : 'btn-secondary'} min-h-11 px-5`}
            >
              {t('Open {section}', { section: t(sectionByRole[role].label) })}
            </Link>
          ))}
        </nav>
      )}

      {/* HERO */}
      <section className="relative w-full max-w-[1440px] mx-auto px-6 lg:px-12 pt-12 pb-20 lg:pt-20 lg:pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-surface-container-high/90 backdrop-blur-md shadow-sm mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="font-label-md text-label-md text-primary tracking-wide">
            Fresh produce & farmland, straight from verified farmers
          </span>
          <span className="material-symbols-outlined text-[15px] text-primary">verified</span>
        </div>

        <h1 className="font-display-lg text-display-lg max-w-4xl tracking-tight text-on-surface mb-6 leading-[1.1]">
          From the Farmer’s Field <br className="hidden sm:inline"/>
          <span className="italic font-display-lg text-primary">to Your Table.</span>
        </h1>
        <p className="font-body-xl text-body-xl text-on-surface-variant max-w-2xl mb-12">
          Farm Platform connects you with hyper-local harvests within hours of cutting. Graded by field agronomists, transported via pooled cold routes, with direct farmland lease plots.
        </p>

        <div className="w-full max-w-3xl bg-surface-container-high/80 backdrop-blur-xl p-3 sm:p-4 rounded-2xl shadow-xl flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <div className="flex items-center gap-3 px-4 py-3 bg-surface-container-lowest rounded-xl flex-1 w-full">
              <span className="material-symbols-outlined text-primary text-[22px]">location_on</span>
              <input
                className="bg-transparent border-0 outline-none w-full font-body-md text-body-md text-on-surface placeholder:text-outline text-ellipsis"
                placeholder="Search crop, heirloom variety, or pin code..."
                defaultValue="Bhilai / Durg"
              />
            </div>
            <div className="flex items-center gap-2 px-3.5 py-3 bg-surface-container-lowest rounded-xl shrink-0 w-full sm:w-auto justify-between sm:justify-start">
              <span className="material-symbols-outlined text-secondary text-[20px]">near_me</span>
              <select defaultValue="Within 50 km" className="bg-transparent border-0 outline-none font-label-md text-label-md text-on-surface-variant cursor-pointer pr-2">
                <option className="bg-surface-container-high text-on-surface">Within 25 km</option>
                <option className="bg-surface-container-high text-on-surface">Within 50 km</option>
                <option className="bg-surface-container-high text-on-surface">Statewide</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <Link to="/catalog" className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md hover:brightness-105 transition-all">
              <span>Browse Fresh Produce</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <Link to="/reserve-farmland" className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-2 transition-all">
              <span className="material-symbols-outlined text-secondary text-[18px]">nature_people</span>
              <span>Reserve Farmland Plot</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-10 text-on-surface-variant font-label-md text-label-md">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">spa</span>
            <span>Zero Middlemen Markups</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-outline-variant hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">add_a_photo</span>
            <span>100% Photo-Verified at Farm</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-outline-variant hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">local_shipping</span>
            <span>Next-Dawn Shared Cold Route</span>
          </div>
        </div>
      </section>

      {/* 3 PILLARS */}
      <section className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="font-label-sm text-label-sm text-primary tracking-widest uppercase mb-2">The Direct Agronomy Advantage</p>
            <h2 className="font-headline-xl text-headline-xl text-on-surface">Fresh food, without the middlemen.</h2>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
            Every lot is cataloged in the soil, inspected at harvest, and batched into cluster deliveries within 18 hours.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group relative bg-surface-container p-8 rounded-2xl flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between mb-8">
              <span className="font-headline-sm text-headline-sm text-outline-variant font-light group-hover:text-primary transition-colors">01</span>
              <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px]">timer</span>
              </div>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Live Freshness Meter</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-6">
                Every crate displays the exact harvest timestamp and sugar brix level. Track down to the farm quadrant where it was clipped.
              </p>
            </div>
            <div className="pt-4 bg-surface-container-low p-4 rounded-xl">
              <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                <span className="text-on-surface">Field Moisture: 89%</span>
                <span className="text-primary font-bold">Cut 4h Ago</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full w-[94%]"></div>
              </div>
            </div>
          </div>

          <div className="group relative bg-surface-container p-8 rounded-2xl flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between mb-8">
              <span className="font-headline-sm text-headline-sm text-outline-variant font-light group-hover:text-secondary transition-colors">02</span>
              <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[24px]">fact_check</span>
              </div>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Inspector Certified</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-6">
                Independent agronomists verify soil inputs, leaf health, and fungal traces before stamping lots with Grade A, B, or C classifications.
              </p>
            </div>
            <div className="pt-4 bg-surface-container-low p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">Grade A • Zero Chemical Residue</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm uppercase">Verified</span>
            </div>
          </div>

          <div className="group relative bg-surface-container p-8 rounded-2xl flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between mb-8">
              <span className="font-headline-sm text-headline-sm text-outline-variant font-light group-hover:text-primary transition-colors">03</span>
              <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px]">hub</span>
              </div>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Pooled Cold Routes</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-6">
                Orders from nearby neighbors merge into a singular temperature-regulated morning vehicle, slashing cold-chain emissions by 68%.
              </p>
            </div>
            <div className="pt-4 bg-surface-container-low p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-on-surface font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-[16px] text-primary">route</span>
                <span>Sub-Cluster #42 (34 Orders)</span>
              </div>
              <span className="text-primary font-label-sm text-label-sm font-bold">12kg CO₂ Saved</span>
            </div>
          </div>
        </div>
      </section>

      {/* SPOTLIGHT CATALOG */}
      <section className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="font-label-sm text-label-sm text-primary tracking-widest uppercase mb-1">On The Morning Harvest Roster</p>
            <h2 className="font-headline-xl text-headline-xl text-on-surface">What farmers near you are offering</h2>
          </div>
          <Link to="/catalog" className="hidden sm:inline-flex items-center gap-2 font-label-lg text-label-lg text-primary hover:underline">
            <span>View all produce</span>
            <span className="material-symbols-outlined text-[18px]">trending_flat</span>
          </Link>
        </div>

        <div className="relative w-full rounded-2xl bg-surface-container overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-12">
          <div className="p-8 lg:p-12 lg:col-span-7 flex flex-col justify-between z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-6">
                <span className="px-3 py-1 rounded-full bg-primary/15 text-primary font-label-sm text-label-sm font-bold tracking-wider uppercase">
                  Peak Fresh • Picked Today 5:30 AM
                </span>
                <span className="px-3 py-1 rounded-full bg-secondary/15 text-secondary font-label-sm text-label-sm font-bold tracking-wider uppercase">
                  Grade A Certified
                </span>
                <span className="px-3 py-1 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">
                  Heirloom Variety
                </span>
              </div>
              <h3 className="font-headline-xl text-headline-xl text-on-surface mb-3">
                Desi Heirloom Tomatoes
              </h3>
              <p className="font-body-lg text-body-md text-on-surface-variant max-w-xl mb-6">
                Cultivated in rich red loam at <strong className="text-on-surface">Hariyali Farms (Plot 3B)</strong>, naturally sun-ripened without artificial ethylene. High acidity and intense aromatic pulp, ideal for slow curries and rustic purées.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <span className="font-label-sm text-label-sm text-outline block mb-1">Origin Distance</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">6.4 km</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <span className="font-label-sm text-label-sm text-outline block mb-1">Inspector Rating</span>
                  <span className="font-headline-sm text-headline-sm text-secondary">9.8 / 10</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl col-span-2 sm:col-span-1">
                  <span className="font-label-sm text-label-sm text-outline block mb-1">Dispatch Batch</span>
                  <span className="font-headline-sm text-headline-sm text-primary">Route #4</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 bg-surface-container-low -mx-8 -mb-8 lg:-mx-12 lg:-mb-12 p-8">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline-xl text-headline-xl text-secondary font-bold">₹38</span>
                  <span className="font-body-md text-body-md text-on-surface-variant">/ kg (Direct Farmer Rate)</span>
                </div>
                <p className="font-label-sm text-label-sm text-outline mt-0.5">Delivered tomorrow before 11:00 AM</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-surface-container-high rounded-xl p-1">
                  <button
                    onClick={() => setSpotlightQty(prev => Math.max(1, prev - 1))}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors font-headline-sm"
                  >-</button>
                  <span className="w-12 text-center font-label-lg text-label-lg font-bold">{spotlightQty} kg</span>
                  <button
                    onClick={() => setSpotlightQty(prev => prev + 1)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors font-headline-sm"
                  >+</button>
                </div>
                <button
                  onClick={() => notify("Orders are placed in the Farm customer app. Create a customer account to buy.")}
                  className="px-6 py-3.5 bg-primary text-on-primary rounded-xl font-label-lg text-label-lg font-bold shadow-md hover:brightness-105 active:scale-95 transition-all"
                >
                  Add to Basket
                </button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 relative min-h-[360px] lg:min-h-[500px] overflow-hidden bg-surface-container-lowest">
            <img
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
              alt="Macro tomatoes"
              src="/img/p01.jpg"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-surface-container via-surface-container/30 to-transparent"></div>
            <div className="absolute bottom-6 right-6 p-4 rounded-xl bg-surface-container-high/90 backdrop-blur-md shadow-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">downloading</span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-outline">Brix Sweetness Index</p>
                <p className="font-label-lg text-label-lg text-on-surface font-bold">5.8 °Bx (Optimal Crisp)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mini cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <div className="bg-surface-container rounded-2xl p-5 flex gap-4 items-center shadow-md">
            <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-surface-container-lowest">
              <img className="w-full h-full object-cover" alt="Baby Palak" src="/img/p02.jpg" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-label-sm text-label-sm font-semibold inline-block mb-1">Cut 2h ago</span>
              <h4 className="font-headline-sm text-headline-sm text-on-surface truncate">Country Baby Palak</h4>
              <p className="font-body-sm text-body-sm text-outline mb-2">Devanahalli Bio-Cluster</p>
              <div className="flex items-center justify-between">
                <span className="font-label-lg text-label-lg text-secondary font-bold">₹24 <span className="text-outline font-normal">/ bunch</span></span>
                <button onClick={() => notify("Orders are placed in the Farm customer app. Create a customer account to buy.")} className="p-2 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary transition-colors text-primary">
                  <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-surface-container rounded-2xl p-5 flex gap-4 items-center shadow-md">
            <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-surface-container-lowest">
              <img className="w-full h-full object-cover" alt="Carrots" src="/img/p03.jpg" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary font-label-sm text-label-sm font-semibold inline-block mb-1">Grade A+</span>
              <h4 className="font-headline-sm text-headline-sm text-on-surface truncate">Native Ooty Carrots</h4>
              <p className="font-body-sm text-body-sm text-outline mb-2">Sholur Terrace Cultivation</p>
              <div className="flex items-center justify-between">
                <span className="font-label-lg text-label-lg text-secondary font-bold">₹52 <span className="text-outline font-normal">/ kg</span></span>
                <button onClick={() => notify("Orders are placed in the Farm customer app. Create a customer account to buy.")} className="p-2 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary transition-colors text-primary">
                  <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-surface-container rounded-2xl p-5 flex gap-4 items-center shadow-md sm:col-span-2 lg:col-span-1">
            <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-surface-container-lowest">
              <img className="w-full h-full object-cover" alt="Honey" src="/img/p04.jpg" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-label-sm text-label-sm font-semibold inline-block mb-1">Raw Unfiltered</span>
              <h4 className="font-headline-sm text-headline-sm text-on-surface truncate">Wild Jamun Honey</h4>
              <p className="font-body-sm text-body-sm text-outline mb-2">Nilgiri Biosphere Apiary</p>
              <div className="flex items-center justify-between">
                <span className="font-label-lg text-label-lg text-secondary font-bold">₹340 <span className="text-outline font-normal">/ 500g</span></span>
                <button onClick={() => notify("Orders are placed in the Farm customer app. Create a customer account to buy.")} className="p-2 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary transition-colors text-primary">
                  <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FARMLAND PLOT RESERVATION TEASER */}
      <section className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-16">
        <div className="relative rounded-3xl overflow-hidden bg-surface-container-low shadow-xl p-8 lg:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 w-fit">
                <span className="material-symbols-outlined text-[16px] text-secondary">potted_plant</span>
                <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">Agrarian Micro-Leasing</span>
              </div>
              <h2 className="font-headline-xl text-headline-xl text-on-surface">
                Reserve a 0.25-Acre Plot.<br/>
                <span className="text-primary italic">Follow your harvest live.</span>
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                Choose what gets sown. An experienced local farmer tends your personal crop with 100% natural composting. Receive weekly video updates, soil sensor graphs, and deliver the seasonal yield to your front door.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link to="/reserve-farmland" className="px-6 py-3.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center gap-2 shadow-md hover:brightness-105 transition-all">
                  <span>Explore Available Plots</span>
                  <span className="material-symbols-outlined text-[18px]">travel_explore</span>
                </Link>
                <Link to="/reserve-farmland" className="px-6 py-3.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-lg text-label-lg flex items-center gap-2 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">play_circle</span>
                  <span>How Farmland Leasing Works</span>
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl relative bg-surface-container">
                <div
                  className="w-full h-64 bg-cover bg-center rounded-2xl relative"
                  style={{ backgroundImage: `url('/img/p05.jpg')` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest/90 via-transparent to-transparent"></div>
                  <div className="absolute top-4 left-4 px-3 py-1 bg-surface-container/80 backdrop-blur-md rounded-full font-label-sm text-label-sm text-on-surface flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <span>Channapatna Block #08</span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-on-surface">
                    <div>
                      <p className="font-label-sm text-label-sm text-outline">Current Crop Phase</p>
                      <p className="font-headline-sm text-headline-sm">Germination (Day 18)</p>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-bold">2 Plots Left</span>
                  </div>
                </div>
                <div className="p-5 bg-surface-container flex justify-between items-center">
                  <div>
                    <p className="font-label-sm text-label-sm text-outline">Managed By</p>
                    <p className="font-label-lg text-label-lg text-on-surface">Ramesh Gowda (3rd Gen Farmer)</p>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-secondary font-bold">₹4,200 <span className="font-body-sm text-body-sm text-outline font-normal">/ mo</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 ROLES */}
      <section className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="font-label-sm text-label-sm text-primary tracking-widest uppercase mb-2">Designed For The Entire Agrarian Lifecycle</p>
          <h2 className="font-headline-xl text-headline-xl text-on-surface mb-4">Choose your role.</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            From cultivation and quality audits to consumer baskets and cold-pool management.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/farmer" className="group relative bg-surface-container rounded-2xl p-7 flex flex-col justify-between shadow-md hover:bg-surface-container-high transition-all">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-[28px]">agriculture</span>
              </div>
              <div className="font-label-sm text-label-sm text-outline mb-1">01 / GROWER</div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3 group-hover:text-primary transition-colors">Farmer</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-6">
                List harvested lots directly at true value, lease fractional farmland, and broadcast real-time harvest alerts to urban clusters.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between font-label-md text-label-md text-primary font-bold">
              <span>Farmer Portal</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </Link>

          <Link to="/customer" className="group relative bg-surface-container rounded-2xl p-7 flex flex-col justify-between shadow-md hover:bg-surface-container-high transition-all">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-secondary mb-6">
                <span className="material-symbols-outlined text-[28px]">shopping_basket</span>
              </div>
              <div className="font-label-sm text-label-sm text-outline mb-1">02 / BUYER</div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3 group-hover:text-secondary transition-colors">Customer</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-6">
                Source pristine produce harvested within hours, track geo-tagged crop certifications, or subscribe to dedicated seasonal plots.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between font-label-md text-label-md text-secondary font-bold">
              <span>Start Ordering</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </Link>

          <Link to="/inspector" className="group relative bg-surface-container rounded-2xl p-7 flex flex-col justify-between shadow-md hover:bg-surface-container-high transition-all cursor-pointer">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-tertiary mb-6">
                <span className="material-symbols-outlined text-[28px]">biotech</span>
              </div>
              <div className="font-label-sm text-label-sm text-outline mb-1">03 / AUDITOR</div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3 group-hover:text-tertiary transition-colors">Inspector</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-6">
                Conduct on-site soil and produce checks. Log refractometer readings, pesticide strip scans, and issue unforgeable digital batch seals.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between font-label-md text-label-md text-tertiary font-bold">
              <span>Audit Console</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </Link>

          <Link to="/admin" className="group relative bg-surface-container rounded-2xl p-7 flex flex-col justify-between shadow-md hover:bg-surface-container-high transition-all cursor-pointer">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary-fixed mb-6">
                <span className="material-symbols-outlined text-[28px]">query_stats</span>
              </div>
              <div className="font-label-sm text-label-sm text-outline mb-1">04 / OPERATIONS</div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3 group-hover:text-primary-fixed transition-colors">Admin</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-6">
                Approve farmer credentials, calculate cold-route pooling density, analyze cluster demand surges, and manage dispute resolutions.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between font-label-md text-label-md text-primary-fixed font-bold">
              <span>Operations Hub</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </Link>
        </div>
      </section>

      {/* CAPSTONE INFO */}
      <section className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-16">
        <div className="p-8 sm:p-12 rounded-3xl bg-surface-container-high flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-[20px]">workspace_premium</span>
              <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">Course Capstone Platform</span>
            </div>
            <h3 className="font-headline-lg text-headline-lg text-on-surface mb-3">
              A CSD Course Initiative Guided by Dr. Gagan Sir
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Pioneering computational supply-chain optimization for localized Indian agriculture. Built with micro-route route consolidation, decentralized verification, and fair price discovery.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full sm:w-auto">
            <button onClick={() => navigate('/how-it-works')} className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2">
              <span>See how it works</span>
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
            </button>
            <Link to="/team" className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-surface-container-highest text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">group</span>
              <span>Meet the Team</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  
      </div>
      <SiteFooter />
    </>
  )
}
