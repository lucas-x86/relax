/*** Copyright 2018 Johannes Kessler
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Group, GroupInfo, GroupSourceType, HeaderTranslated, SourceInfo } from 'calc2/store/groups';
import { parseRelalgGroup, relalgFromRelalgAstNode, replaceVariables } from 'db/relax-core';
import { readTextFile } from '@tauri-apps/plugin-fs';

import ld_sb from '../data/sb.txt?raw';
import ld_ufes from '../data/ufes.txt?raw';
import ld from '../data/misc.txt?raw';
import ld_uibk from '../data/uibk.txt?raw';
import ld_starter from '../data/starter.txt?raw';
const LOCAL_DATA: { [id: string]: string } = {
	'sb': ld_sb.default ? ld_sb.default : ld_sb,
  'ufes': ld_ufes.default ? ld_ufes.default : ld_ufes,
  'misc': ld.default ? ld.default : ld,
  'uibk': ld_uibk.default ? ld_uibk.default : ld_uibk,
  'starter': ld_starter.default ? ld_starter.default : ld_starter,
};

export function parseGroupsFromDefinition(text: string, groupInfo: GroupInfo, sourceInfo: SourceInfo) {
  const groupAst = parseRelalgGroup(text);
  return getGroupsFromGroupAst(groupAst, groupInfo, sourceInfo);
}


function extractTranslatedHeader<T extends string | null>(
  headers: relalgAst.Group['headers'],
  headerName: string,
  emptyFallback: string,
): HeaderTranslated {

  headers = headers.filter(({ name }) => name === headerName);

  if (headers.length === 0) {
    return {
      fallback: emptyFallback,
    };
  }

  let fallback: null | string = null;
  const tmp: { [lang: string]: string } = {};

  for (let i = 0; i < headers.length; i++) {
    let { name, lang, text } = headers[i];
    text = text.trim();

    if (lang === null || fallback === null) {
      // use the first one as fallback (if no generic one appears later)
      fallback = text;
    }
    else {
      lang = lang.toLocaleLowerCase();

      tmp[lang] = text;
    }
  }

  return {
    fallback: fallback!,
    ...tmp,
  };
}

export function getGroupsFromGroupAst(groupAst: relalgAst.GroupRoot, groupInfo: GroupInfo, sourceInfo: SourceInfo) {
  const groups: Group[] = [];
	
  for (let i = 0; i < groupAst.groups.length; i++) {
    const astGroup = groupAst.groups[i];
    replaceVariables(astGroup, {});

    // empty should not happen as the parser ensures that at least one 'group' header is present;
    const groupName = extractTranslatedHeader(astGroup.headers, 'group', 'unknown group');
    const groupDesc = extractTranslatedHeader(astGroup.headers, 'description', '');

    const category = extractTranslatedHeader(astGroup.headers, 'category', '');
    // FIXME: category need to be null for misc/no group
		
		
    const group: Group = {
      groupName,
      groupDesc,
      category,
			exampleSQL: astGroup.exampleSql,
			exampleBags: astGroup.exampleBags,
			exampleRA: astGroup.exampleRA,
      tables: [],
      groupInfo: {
        ...groupInfo,
        index: i,
      },
      sourceInfo,
      definition: astGroup.codeInfo.text,
    };
		
    // tables
    for (let j = 0; j < astGroup.assignments.length; j++) {
      const result = relalgFromRelalgAstNode(astGroup.assignments[j].child, {});
		
      result.check();

      const relation = result.getResult(false).createRelation(astGroup.assignments[j].name);

      const schema = relation.getSchema();
      const columnNames = new Array(schema.getSize());
      const columnTypes = new Array(schema.getSize());
      for (let k = 0; k < schema.getSize(); k++) {
        const c = schema.getColumn(k);
        columnNames[k] = c.getName();
        columnTypes[k] = c.getType();
      }

      group.tables[j] = {
        tableId: 1,
        tableName: astGroup.assignments[j].name,
        columnNames: columnNames,
        columnTypes: columnTypes,
        relation: relation,
      };
    }

    groups.push(group);
  }
  return groups;
}

/**
 * loads group definition(s) from a local source (built-in dataset or file on disk).
 */
export async function loadGroupsFromSource(source: GroupSourceType, id: string, maintainer: string, maintainerGroup: string): Promise<Group[]> {
  switch (source) {
    case 'local': {
      try {
        const data: string = LOCAL_DATA[id];
        const info: GroupInfo = {
          source,
          id,
          filename: 'local',
          index: -1,
          maintainer,
          maintainerGroup,
        };
        return parseGroupsFromDefinition(data, info, {});
      }
      catch (e) {
        const msg = 'cannot parse groups file: ' + (e as Error).message;
        console.error(msg, e);
        throw new Error(msg);
      }
    }
    case 'file': {
      try {
        const data = await readTextFile(id);
        const filename = id.split(/[\\/]/).pop() || id;
        const info: GroupInfo = {
          source,
          id,
          filename,
          index: -1,
          maintainer,
          maintainerGroup,
        };
        const sourceInfo: SourceInfo = {
          url: id,
          lastModified: new Date(),
        };
        return parseGroupsFromDefinition(data, info, sourceInfo);
      }
      catch (e) {
        const msg = 'cannot read or parse file: ' + (e as Error).message;
        console.error(msg, e);
        throw new Error(msg);
      }
    }
    default:
      throw new Error('unknown source ' + source);
  }
}
