import React from 'react';
import { ResourceItem } from '../types';
import { Badge } from './Badge';
import { FileText, Link, Hash, Calendar, BookOpen, Download } from 'lucide-react';

interface ResourceTableProps {
  title: string;
  items: ResourceItem[];
  type: 'note' | 'book';
}

export const ResourceTable: React.FC<ResourceTableProps> = ({ title, items, type }) => {
  if (items.length === 0) return null;

  return (
    <div className="mb-12">
      <h3 className="text-xl font-semibold mb-3 text-[#37352f] px-1 border-l-2 border-transparent hover:border-black transition-colors">
        {title}
      </h3>
      
      <div className="overflow-x-auto border-t border-b border-[#e9e9e7] sm:border-0">
        <table className="w-full text-left text-sm border-collapse table-fixed min-w-[600px]">
          <thead>
            <tr className="border-b border-[#e9e9e7]">
              {type === 'note' ? (
                <>
                  <th className="font-normal text-gray-400 py-2 px-3 w-5/12 border-r border-[#e9e9e7]">
                    <div className="flex items-center gap-2"><FileText size={14} /> Descr.</div>
                  </th>
                  <th className="font-normal text-gray-400 py-2 px-3 w-4/12 border-r border-[#e9e9e7]">
                    <div className="flex items-center gap-2"><Link size={14} /> Files & media</div>
                  </th>
                  <th className="font-normal text-gray-400 py-2 px-3 w-1/12 border-r border-[#e9e9e7]">
                    <div className="flex items-center gap-2"><Hash size={14} /> Anno</div>
                  </th>
                  <th className="font-normal text-gray-400 py-2 px-3 w-2/12">
                    <div className="flex items-center gap-2"><BookOpen size={14} /> Corso</div>
                  </th>
                </>
              ) : (
                <>
                  <th className="font-normal text-gray-400 py-2 px-3 w-4/12 border-r border-[#e9e9e7]">
                    <div className="flex items-center gap-2"><BookOpen size={14} /> Book</div>
                  </th>
                  <th className="font-normal text-gray-400 py-2 px-3 w-3/12 border-r border-[#e9e9e7]">
                     Author
                  </th>
                  <th className="font-normal text-gray-400 py-2 px-3 w-2/12 border-r border-[#e9e9e7]">
                    <div className="flex items-center gap-2"><Calendar size={14} /> Data</div>
                  </th>
                  <th className="font-normal text-gray-400 py-2 px-3 w-2/12 border-r border-[#e9e9e7]">
                     Corso
                  </th>
                  <th className="font-normal text-gray-400 py-2 px-3 w-1/12">
                     <div className="flex items-center gap-2"><Download size={14} /> Link</div>
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="group hover:bg-gray-50 border-b border-[#e9e9e7] last:border-b-0">
                {/* --- NOTE ROW LAYOUT --- */}
                {type === 'note' && (
                  <>
                    <td className="py-2 px-3 border-r border-[#e9e9e7] align-top">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium text-[#37352f] border-b border-gray-300 hover:text-blue-600 flex items-center gap-2">
                         {item.icon && <img src={item.icon} alt="" className="w-4 h-4" />}
                         {item.title}
                      </a>
                    </td>
                    <td className="py-2 px-3 border-r border-[#e9e9e7] align-top text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">
                       <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{item.url}</a>
                    </td>
                    <td className="py-2 px-3 border-r border-[#e9e9e7] align-top text-gray-500">
                      {item.year}
                    </td>
                    <td className="py-2 px-3 align-top">
                      <Badge label={item.category} color={item.categoryColor} />
                    </td>
                  </>
                )}

                {/* --- BOOK ROW LAYOUT --- */}
                {type === 'book' && (
                  <>
                    <td className="py-2 px-3 border-r border-[#e9e9e7] align-top">
                      <div className="flex items-center gap-2">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium text-[#37352f] border-b border-gray-300 hover:text-blue-600 flex items-center gap-2">
                          <img src="https://www.notion.so/icons/book_gray.svg" alt="book" className="w-4 h-4 opacity-50" />
                          {item.title}
                        </a>
                      </div>
                    </td>
                    <td className="py-2 px-3 border-r border-[#e9e9e7] align-top text-gray-600">
                      {item.description}
                    </td>
                    <td className="py-2 px-3 border-r border-[#e9e9e7] align-top text-gray-400 text-xs">
                      {item.dateAdded}
                    </td>
                    <td className="py-2 px-3 border-r border-[#e9e9e7] align-top">
                      <Badge label={item.category} color={item.categoryColor} />
                    </td>
                    <td className="py-2 px-3 align-top">
                       <a href={item.url} className="text-blue-500 hover:bg-blue-50 p-1 rounded inline-block">
                         Download
                       </a>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
