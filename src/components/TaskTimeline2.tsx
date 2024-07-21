export function TaskTimeline() {
  return (
    <div className="-my-6">
      {/** Item #1 */}
      <div className="group relative py-6 pl-8 sm:pl-32">
        {/** label */}
        <div className="font-caveat mb-1 text-2xl font-medium sm:mb-0">
          The origin
        </div>
        {/** Vertical line (::before) ~ Date ~ Title ~ Circle marker (::after) */}
        <div className="mb-1 flex flex-col items-start before:absolute before:left-2 before:h-full before:-translate-x-1/2 before:translate-y-3 before:self-start before:bg-slate-300 before:px-px after:absolute after:left-2 after:box-content after:h-2 after:w-2 after:-translate-x-1/2 after:translate-y-1.5 after:rounded-full after:border-4 after:border-slate-50 after:bg-indigo-600 group-last:before:hidden sm:flex-row sm:before:left-0 sm:before:ml-[6.5rem] sm:after:left-0 sm:after:ml-[6.5rem]">
          <time className="left-0 mb-3 inline-flex h-6 w-20 translate-y-0.5 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold uppercase text-emerald-600 sm:absolute sm:mb-0">
            May, 2020
          </time>
          <div className="text-xl font-bold">
            Acme was founded in Milan, Italy
          </div>
        </div>
        {/** Content */}
        <div className="text-slate-500">
          Pretium lectus quam id leo. Urna et pharetra pharetra massa massa.
          Adipiscing enim eu neque aliquam vestibulum morbi blandit cursus
          risus.
        </div>
      </div>
      {/** Item #2 */}
      <div className="group relative py-6 pl-8 sm:pl-32">
        {/** label */}
        <div className="font-caveat mb-1 text-2xl font-medium sm:mb-0">
          The milestone
        </div>
        {/** Vertical line (::before) ~ Date ~ Title ~ Circle marker (::after) */}
        <div className="mb-1 flex flex-col items-start before:absolute before:left-2 before:h-full before:-translate-x-1/2 before:translate-y-3 before:self-start before:bg-slate-300 before:px-px after:absolute after:left-2 after:box-content after:h-2 after:w-2 after:-translate-x-1/2 after:translate-y-1.5 after:rounded-full after:border-4 after:border-slate-50 after:bg-indigo-600 group-last:before:hidden sm:flex-row sm:before:left-0 sm:before:ml-[6.5rem] sm:after:left-0 sm:after:ml-[6.5rem]">
          <time className="left-0 mb-3 inline-flex h-6 w-20 translate-y-0.5 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold uppercase text-emerald-600 sm:absolute sm:mb-0">
            May, 2021
          </time>
          <div className="text-xl font-bold">Reached 5K customers</div>
        </div>
        {/** Content */}
        <div className="text-slate-500">
          Pretium lectus quam id leo. Urna et pharetra pharetra massa massa.
          Adipiscing enim eu neque aliquam vestibulum morbi blandit cursus
          risus.
        </div>
      </div>
      {/** Item #3 */}
      <div className="group relative py-6 pl-8 sm:pl-32">
        {/** label */}
        <div className="font-caveat mb-1 text-2xl font-medium sm:mb-0">
          The acquisitions
        </div>
        {/** Vertical line (::before) ~ Date ~ Title ~ Circle marker (::after) */}
        <div className="mb-1 flex flex-col items-start before:absolute before:left-2 before:h-full before:-translate-x-1/2 before:translate-y-3 before:self-start before:bg-slate-300 before:px-px after:absolute after:left-2 after:box-content after:h-2 after:w-2 after:-translate-x-1/2 after:translate-y-1.5 after:rounded-full after:border-4 after:border-slate-50 after:bg-indigo-600 group-last:before:hidden sm:flex-row sm:before:left-0 sm:before:ml-[6.5rem] sm:after:left-0 sm:after:ml-[6.5rem]">
          <time className="left-0 mb-3 inline-flex h-6 w-20 translate-y-0.5 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold uppercase text-emerald-600 sm:absolute sm:mb-0">
            May, 2022
          </time>
          <div className="text-xl font-bold">
            Acquired various companies, inluding Technology Inc.
          </div>
        </div>
        {/** Content */}
        <div className="text-slate-500">
          Pretium lectus quam id leo. Urna et pharetra pharetra massa massa.
          Adipiscing enim eu neque aliquam vestibulum morbi blandit cursus
          risus.
        </div>
      </div>
      {/** Item #4 */}
      <div className="group relative py-6 pl-8 sm:pl-32">
        {/** label */}
        <div className="font-caveat mb-1 text-2xl font-medium sm:mb-0">
          The IPO
        </div>
        {/** Vertical line (::before) ~ Date ~ Title ~ Circle marker (::after) */}
        <div className="mb-1 flex flex-col items-start before:absolute before:left-2 before:h-full before:-translate-x-1/2 before:translate-y-3 before:self-start before:bg-slate-300 before:px-px after:absolute after:left-2 after:box-content after:h-2 after:w-2 after:-translate-x-1/2 after:translate-y-1.5 after:rounded-full after:border-4 after:border-slate-50 after:bg-indigo-600 group-last:before:hidden sm:flex-row sm:before:left-0 sm:before:ml-[6.5rem] sm:after:left-0 sm:after:ml-[6.5rem]">
          <time className="left-0 mb-3 inline-flex h-6 w-20 translate-y-0.5 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold uppercase text-emerald-600 sm:absolute sm:mb-0">
            May, 2023
          </time>
          <div className="text-xl font-bold">
            Acme went public at the New York Stock Exchange
          </div>
        </div>
        {/** Content */}
        <div className="text-slate-500">
          Pretium lectus quam id leo. Urna et pharetra pharetra massa massa.
          Adipiscing enim eu neque aliquam vestibulum morbi blandit cursus
          risus.
        </div>
      </div>
    </div>
  );
}
