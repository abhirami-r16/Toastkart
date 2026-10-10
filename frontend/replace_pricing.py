import os
import re

files_to_update = [
    'src/pages/PlanSelection.jsx',
    'src/pages/Plans.jsx',
    'src/components/home/HomePricing.jsx'
]

def update_file(filepath):
    if not os.path.exists(filepath):
        print(f"Not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # PlanSelection.jsx has multiline spacing
    # Plans.jsx has single line: 799<span className="period">/month</span>
    
    # 799 /month -> 7,999 /year
    content = re.sub(r'799(\s*<span className="period">\s*)/month', r'7,999\1/year', content)
    # 999 /month -> 9,999 /year
    content = re.sub(r'999(\s*<span className="period">\s*)/month', r'9,999\1/year', content)
    # 1,999 /month -> 19,999 /year
    content = re.sub(r'1,999(\s*<span className="period">\s*)/month', r'19,999\1/year', content)

    # In PlanSelection.jsx modal:
    # const [billingCycle, setBillingCycle] = useState('monthly');
    content = content.replace("useState('monthly');", "useState('yearly');")
    
    # Hide Billing Cycle Dropdown by removing or commenting it out. 
    # Actually, the user asked to change the plans to yearly ONLY. So let's just comment out the select div.
    # It looks like:
    #             <div className="mb-3">
    #
    #               <label className="fw-semibold mb-2">
    #                 Billing Cycle
    #               </label>
    #
    #               <select ...
    #               > ... </select>
    #             </div>
    # Let's replace the whole block or just set hidden.
    content = re.sub(r'(<div className="mb-3">\s*<label className="fw-semibold mb-2">\s*Billing Cycle\s*</label>\s*<select[\s\S]*?</select>\s*</div>)', r'{/* \1 */}', content)

    # also update the modal logic: 
    # {billingCycle === 'monthly' ? ... : ... }
    # Since billingCycle is always yearly, it will display the yearly prices correctly.
    # But wait, in the auto-pay text:
    # {billingCycle === 'monthly' ? 'monthly' : 'yearly'} -> this is fine, it will evaluate to 'yearly'.

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        print(f"Updated {filepath}")

for f in files_to_update:
    update_file(f)
