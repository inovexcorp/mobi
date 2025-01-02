package com.mobi.catalog.api.builder;

/*-
 * #%L
 * com.mobi.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import org.eclipse.rdf4j.model.Literal;

import java.util.Objects;

public class KeywordCount {
    private Literal keyword;
    private Integer keywordCount;

    public KeywordCount(Literal keyword, Integer keywordCount) {
        this.keyword = keyword;
        this.keywordCount = keywordCount;
    }

    public Literal getKeyword() {
        return keyword;
    }

    public Integer getKeywordCount() {
        return keywordCount;
    }

    @Override
    public String toString() {
        return "KC(" + keyword.stringValue() + ", " + keywordCount + ")";
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (other == null || getClass() != other.getClass()) return false;
        KeywordCount otherKeywordCount = (KeywordCount) other;
        return Objects.equals(keyword, otherKeywordCount.keyword) &&
                Objects.equals(keywordCount, otherKeywordCount.keywordCount);
    }

    @Override
    public int hashCode() {
        return Objects.hash(keyword, keywordCount);
    }
}
