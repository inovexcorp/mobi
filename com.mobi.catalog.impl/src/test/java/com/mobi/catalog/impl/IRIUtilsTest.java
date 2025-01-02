package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class IRIUtilsTest {

    @Test
    public void getBeautifulIRIVersionInfo(){
        String iri = "http://www.w3.org/2002/07/owl#versionInfo";
        assertEquals("Version Info", IRIUtils.getBeautifulIRILabel(iri));
    }

    @Test
    public void getBeautifulIRIVersionInfoSpace(){
        String iri = "        http://www.w3.org/2002/07/owl#versionInfo                ";
        assertEquals("Version Info", IRIUtils.getBeautifulIRILabel(iri));
    }

    @Test
    public void getBeautifulIRIComment(){
        String iri = "http://www.w3.org/2000/01/rdf-schema#comment";
        assertEquals("Comment", IRIUtils.getBeautifulIRILabel(iri));
    }

    @Test
    public void getBeautifulIRIUUID(){
        String iri = "https://mobi.com/records#b1ec4075-c288-4b7b-b54b-e3f8266e1961";
        assertEquals("b1ec4075-c288-4b7b-b54b-e3f8266e1961", IRIUtils.getBeautifulIRILabel(iri));
    }

    @Test
    public void getBeautifulIRIEmptyString(){
        String iri = "          ";
        assertEquals("", IRIUtils.getBeautifulIRILabel(iri));
    }

    @Test
    public void getBeautifulIRINull(){
        assertEquals("", IRIUtils.getBeautifulIRILabel(null));
    }

    @Test
    public void getBeautifulIRIEx1(){
        String iri = "http://a.b\".";
        assertEquals("A.b\".", IRIUtils.getBeautifulIRILabel(iri));
    }
}
