package com.mobi.document.translator.impl.csv;

/*-
 * #%L
 * com.mobi.document.translator.csv
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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

public class CsvRangeItem {
    private String type = null;
    private final String INTEGER = "integer";
    private final String STRING = "string";
    private final String DOUBLE = "double";

    /**
     * Checks for the type of a cell and compares it to the currently set type of the property
     * @param token
     */
    public void checkTokenType(String token) {
        if (token.equalsIgnoreCase("false") || token.equalsIgnoreCase("true")) {
            compareTypes("boolean");
        } else if (checkNumber(token) == false) {
            compareTypes(STRING);
        }
    }

    /**
     *Retrieves the datatype of the property
     * @return String representing the range of the property
     */
    public String getRangeType() {
        return this.type;
    }

    private void compareTypes(String currentType) {
        if (this.type == null) {
            this.type = currentType;
        } else if ((this.type.equals(INTEGER) && currentType.equals(DOUBLE)) || (this.type.equals(DOUBLE) && currentType.equals(INTEGER))) {
            this.type = DOUBLE;
        } else if (!this.type.equals(currentType)) {
            this.type = STRING;
        }
    }

    private boolean checkNumber(String token) {
        try {
            double doubleCheck = Double.parseDouble(token);

            if (doubleCheck % 1 != 0) {
                compareTypes(DOUBLE);
            } else {
                compareTypes(INTEGER);
            }
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
